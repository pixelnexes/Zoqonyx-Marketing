import { Worker, Job } from "bullmq";
import { redisConnection, QUEUE_NAMES } from "../lib/redis";
import { prisma } from "../lib/prisma";
import { MailboxService } from "../services/mailbox.service";
import { ProviderFactory } from "../lib/providers/provider-factory";
import { LeadStatus, CampaignLeadStatus, EmailDispatchStatus } from "@prisma/client";

export interface EmailDispatchJobData {
  scheduledEmailId: string;
}

export function createEmailDispatchWorker() {
  const worker = new Worker<EmailDispatchJobData>(
    QUEUE_NAMES.EMAIL_DISPATCH,
    async (job: Job<EmailDispatchJobData>) => {
      const { scheduledEmailId } = job.data;

      // 1. Fetch ScheduledEmail with full lead, campaign, sequenceStep, and mailbox context
      const item = await prisma.scheduledEmail.findUnique({
        where: { id: scheduledEmailId },
        include: {
          lead: true,
          campaign: true,
          sequenceStep: true,
          mailbox: true,
        },
      });

      if (!item || item.status === EmailDispatchStatus.CANCELLED || item.status === EmailDispatchStatus.SENT) {
        return { skipped: true, reason: "Already processed or cancelled" };
      }

      // 2. Pre-flight Deliverability Verification
      if (
        item.lead.status === LeadStatus.REPLIED ||
        item.lead.status === LeadStatus.UNSUBSCRIBED ||
        item.lead.status === LeadStatus.BOUNCED
      ) {
        await prisma.scheduledEmail.update({
          where: { id: item.id },
          data: { status: EmailDispatchStatus.CANCELLED, errorMessage: `Lead status is ${item.lead.status}` },
        });
        return { cancelled: true, reason: `Lead status is ${item.lead.status}` };
      }

      // Check suppression list
      const suppressed = await prisma.suppressionList.findFirst({
        where: { organizationId: item.organizationId, email: item.lead.email },
      });
      if (suppressed) {
        await prisma.scheduledEmail.update({
          where: { id: item.id },
          data: { status: EmailDispatchStatus.CANCELLED, errorMessage: `Email suppressed (${suppressed.reason})` },
        });
        return { cancelled: true, reason: "Suppressed" };
      }

      // Check mailbox limits
      if (item.mailbox.status !== "ACTIVE") {
        await prisma.scheduledEmail.update({
          where: { id: item.id },
          data: { status: EmailDispatchStatus.FAILED, errorMessage: "Mailbox not active" },
        });
        return { failed: true, reason: "Mailbox inactive" };
      }

      // 3. Mark as DISPATCHING in an atomic lock
      await prisma.scheduledEmail.update({
        where: { id: item.id },
        data: { status: EmailDispatchStatus.DISPATCHING },
      });

      // 4. Perform live send
      try {
        const credentials = await MailboxService.getDecryptedCredentials(item.mailbox.id);
        const provider = ProviderFactory.getProvider(item.mailbox.providerType);

        const sendResult = await provider.sendEmail(credentials, {
          to: item.lead.email,
          fromName: item.mailbox.fromName,
          fromEmail: item.mailbox.email,
          replyTo: item.mailbox.replyToEmail || item.mailbox.email,
          subject: item.subject,
          htmlBody: item.renderedHtml,
          textBody: item.renderedText || undefined,
        });

        if (!sendResult.success) {
          await prisma.scheduledEmail.update({
            where: { id: item.id },
            data: {
              status: EmailDispatchStatus.FAILED,
              errorMessage: sendResult.error || "Provider error",
            },
          });
          throw new Error(sendResult.error || "Provider dispatch failed");
        }

        // 5. Record SentEmail ledger
        await prisma.sentEmail.create({
          data: {
            organizationId: item.organizationId,
            campaignId: item.campaignId,
            leadId: item.leadId,
            sequenceStepId: item.sequenceStepId,
            mailboxId: item.mailboxId,
            messageId: sendResult.messageId || null,
            idempotencyKey: item.idempotencyKey,
            toEmail: item.lead.email,
            fromEmail: item.mailbox.email,
            subject: item.subject,
            bodyHtml: item.renderedHtml,
            bodyText: item.renderedText,
          },
        });

        // 6. Update ScheduledEmail status
        await prisma.scheduledEmail.update({
          where: { id: item.id },
          data: { status: EmailDispatchStatus.SENT },
        });

        // 7. Update DailyUsageMetric and Mailbox sentToday count
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await Promise.all([
          prisma.mailbox.update({
            where: { id: item.mailbox.id },
            data: { sentToday: { increment: 1 } },
          }),
          prisma.dailyUsageMetric.upsert({
            where: {
              organizationId_date: { organizationId: item.organizationId, date: today },
            },
            create: {
              organizationId: item.organizationId,
              date: today,
              emailsSent: 1,
            },
            update: {
              emailsSent: { increment: 1 },
            },
          }),
        ]);

        // 8. Determine Next Step in Sequence
        const nextStepNumber = item.sequenceStep.stepNumber + 1;
        const nextStep = await prisma.sequenceStep.findFirst({
          where: { campaignId: item.campaignId, stepNumber: nextStepNumber },
        });

        if (nextStep) {
          const nextRunDate = new Date();
          nextRunDate.setDate(nextRunDate.getDate() + (nextStep.waitDays || 1));

          await prisma.campaignLead.update({
            where: {
              campaignId_leadId: { campaignId: item.campaignId, leadId: item.leadId },
            },
            data: {
              currentStepNumber: nextStepNumber,
              nextExecutionAt: nextRunDate,
              status: CampaignLeadStatus.IN_PROGRESS,
            },
          });
        } else {
          // Sequence completed for this lead
          await prisma.campaignLead.update({
            where: {
              campaignId_leadId: { campaignId: item.campaignId, leadId: item.leadId },
            },
            data: {
              status: CampaignLeadStatus.COMPLETED,
            },
          });
        }

        return { success: true, messageId: sendResult.messageId };
      } catch (err: any) {
        await prisma.scheduledEmail.update({
          where: { id: item.id },
          data: {
            status: EmailDispatchStatus.FAILED,
            errorMessage: err.message,
          },
        });
        throw err;
      }
    },
    {
      connection: redisConnection,
      concurrency: 5,
    }
  );

  return worker;
}
