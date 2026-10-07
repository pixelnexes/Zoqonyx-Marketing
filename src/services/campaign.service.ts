import { prisma } from "../lib/prisma";
import { CampaignStatus, StepType, CampaignLeadStatus } from "@prisma/client";
import { renderTemplate, injectUnsubscribeFooter } from "../lib/template-renderer";
import { MailboxService } from "./mailbox.service";
import { ProviderFactory } from "../lib/providers/provider-factory";

export interface SequenceStepInput {
  stepNumber: number;
  stepType: StepType;
  waitDays: number;
  subject?: string;
  bodyHtml?: string;
  bodyText?: string;
}

export class CampaignService {
  /**
   * Creates a new campaign workspace.
   */
  static async createCampaign(
    organizationId: string,
    data: {
      name: string;
      description?: string;
      mailboxId?: string;
      dailyLimit?: number;
      timezone?: string;
      sendingDays?: number[];
      startHour?: number;
      endHour?: number;
      isTestMode?: boolean;
      autoEnrollRules?: Record<string, any>;
    }
  ) {
    return prisma.campaign.create({
      data: {
        organizationId,
        name: data.name,
        description: data.description || null,
        mailboxId: data.mailboxId || null,
        dailyLimit: data.dailyLimit || 50,
        timezone: data.timezone || "UTC",
        sendingDays: data.sendingDays || [1, 2, 3, 4, 5],
        startHour: data.startHour ?? 9,
        endHour: data.endHour ?? 17,
        isTestMode: data.isTestMode || false,
        autoEnrollRules: data.autoEnrollRules ? (data.autoEnrollRules as any) : undefined,
        status: CampaignStatus.DRAFT,
      },
    });
  }

  /**
   * Sets or updates sequence steps for a campaign.
   */
  static async setSequenceSteps(
    campaignId: string,
    organizationId: string,
    steps: SequenceStepInput[]
  ) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, organizationId },
    });
    if (!campaign) throw new Error("Campaign not found");

    // Replace steps within transaction
    return prisma.$transaction(async (tx) => {
      await tx.sequenceStep.deleteMany({
        where: { campaignId },
      });

      const created = await Promise.all(
        steps.map((step) =>
          tx.sequenceStep.create({
            data: {
              campaignId,
              stepNumber: step.stepNumber,
              stepType: step.stepType,
              waitDays: step.waitDays || 0,
              subject: step.subject || null,
              bodyHtml: step.bodyHtml || null,
              bodyText: step.bodyText || null,
            },
          })
        )
      );

      return created;
    });
  }

  /**
   * Validates prerequisites before campaign launch (Pre-flight audit).
   */
  static async validateCampaignPrerequisites(campaignId: string, organizationId: string) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, organizationId },
      include: {
        mailbox: true,
        sequenceSteps: { orderBy: { stepNumber: "asc" } },
        _count: {
          select: { campaignLeads: true },
        },
      },
    });

    if (!campaign) throw new Error("Campaign not found");

    const issues: string[] = [];

    if (!campaign.mailboxId || !campaign.mailbox) {
      issues.push("No sending mailbox connected to this campaign.");
    } else if (campaign.mailbox.status !== "ACTIVE") {
      issues.push(`Sending mailbox is in '${campaign.mailbox.status}' state.`);
    }

    if (campaign.sequenceSteps.length === 0) {
      issues.push("Campaign must have at least one email sequence step.");
    } else {
      const firstStep = campaign.sequenceSteps[0];
      if (!firstStep.subject || !firstStep.bodyHtml) {
        issues.push("Step 1 must have both a Subject and Email Content.");
      }
    }

    if (campaign._count.campaignLeads === 0 && !campaign.autoEnrollRules) {
      issues.push("No leads are currently enrolled in this campaign.");
    }

    return {
      isValid: issues.length === 0,
      issues,
      campaign,
    };
  }

  /**
   * Launches or unpauses an active campaign.
   */
  static async launchCampaign(campaignId: string, organizationId: string) {
    const validation = await this.validateCampaignPrerequisites(campaignId, organizationId);
    if (!validation.isValid) {
      throw new Error(`Cannot launch campaign: ${validation.issues.join("; ")}`);
    }

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: CampaignStatus.RUNNING },
    });

    // Schedule next batch of pending leads
    await this.queueInitialBatch(campaignId, organizationId);

    return updated;
  }

  /**
   * Enqueues pending step 1 dispatches for all enrolled leads.
   */
  static async queueInitialBatch(campaignId: string, organizationId: string) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        sequenceSteps: { orderBy: { stepNumber: "asc" }, take: 1 },
        mailbox: true,
      },
    });
    if (!campaign || !campaign.mailboxId || !campaign.sequenceSteps.length) return;

    const firstStep = campaign.sequenceSteps[0];

    // Find enrolled leads that haven't been sent step 1
    const campaignLeads = await prisma.campaignLead.findMany({
      where: {
        campaignId,
        currentStepNumber: 1,
        status: CampaignLeadStatus.ENROLLED,
      },
      take: 200,
      include: { lead: true },
    });

    const now = new Date();

    for (const cl of campaignLeads) {
      const idempotencyKey = `${campaign.id}:${cl.leadId}:1`;

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const unsubscribeUrl = `${appUrl}/unsubscribe/${cl.lead.unsubscribeToken}`;

      const renderedSubject = renderTemplate(firstStep.subject || "", {
        ...cl.lead,
        customFields: cl.lead.customFields as Record<string, any>,
        unsubscribeUrl,
      });

      let renderedHtml = renderTemplate(firstStep.bodyHtml || "", {
        ...cl.lead,
        customFields: cl.lead.customFields as Record<string, any>,
        unsubscribeUrl,
      });

      renderedHtml = injectUnsubscribeFooter(renderedHtml, unsubscribeUrl);

      await prisma.scheduledEmail.upsert({
        where: { idempotencyKey },
        create: {
          organizationId,
          campaignId: campaign.id,
          leadId: cl.lead.id,
          sequenceStepId: firstStep.id,
          mailboxId: campaign.mailboxId,
          idempotencyKey,
          scheduledFor: now,
          status: "PENDING",
          subject: renderedSubject,
          renderedHtml,
          renderedText: firstStep.bodyText
            ? renderTemplate(firstStep.bodyText, {
                ...cl.lead,
                customFields: cl.lead.customFields as Record<string, any>,
                unsubscribeUrl,
              })
            : null,
        },
        update: {},
      });

      await prisma.campaignLead.update({
        where: { id: cl.id },
        data: { status: CampaignLeadStatus.IN_PROGRESS },
      });
    }
  }

  /**
   * Performs dry-run test send for campaign review.
   */
  static async sendTestRun(
    campaignId: string,
    organizationId: string,
    recipientEmail: string
  ) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, organizationId },
      include: {
        mailbox: true,
        sequenceSteps: { orderBy: { stepNumber: "asc" } },
      },
    });
    if (!campaign || !campaign.mailbox) throw new Error("Campaign or mailbox not configured");
    if (!campaign.sequenceSteps.length) throw new Error("No sequence steps created yet");

    const firstStep = campaign.sequenceSteps[0];
    const sampleLead = {
      firstName: "Alex",
      lastName: "Tester",
      email: recipientEmail,
      company: "Acme Healthcare Innovations",
      jobTitle: "Managing Director",
      city: "San Francisco",
      customFields: {},
    };

    const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/unsubscribe/test-preview-token`;

    const subject = `[Preview] ${renderTemplate(firstStep.subject || "", sampleLead)}`;
    const html = injectUnsubscribeFooter(
      renderTemplate(firstStep.bodyHtml || "", { ...sampleLead, unsubscribeUrl }),
      unsubscribeUrl
    );

    const creds = await MailboxService.getDecryptedCredentials(campaign.mailbox.id);
    const provider = ProviderFactory.getProvider(campaign.mailbox.providerType);

    return provider.sendEmail(creds, {
      to: recipientEmail,
      fromName: campaign.mailbox.fromName,
      fromEmail: campaign.mailbox.email,
      replyTo: campaign.mailbox.replyToEmail || campaign.mailbox.email,
      subject,
      htmlBody: html,
    });
  }

  /**
   * Retrieves high-level analytics for a specific campaign.
   */
  static async getCampaignAnalytics(campaignId: string, organizationId: string) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, organizationId },
      include: {
        _count: {
          select: {
            campaignLeads: true,
            sentEmails: true,
            scheduledEmails: true,
          },
        },
      },
    });
    if (!campaign) throw new Error("Campaign not found");

    const [repliedCount, bouncedCount, unsubscribedCount] = await Promise.all([
      prisma.campaignLead.count({ where: { campaignId, status: CampaignLeadStatus.REPLIED } }),
      prisma.campaignLead.count({ where: { campaignId, status: CampaignLeadStatus.BOUNCED } }),
      prisma.campaignLead.count({ where: { campaignId, status: CampaignLeadStatus.UNSUBSCRIBED } }),
    ]);

    const sentCount = campaign._count.sentEmails;
    const replyRate = sentCount > 0 ? ((repliedCount / sentCount) * 100).toFixed(1) : "0.0";
    const bounceRate = sentCount > 0 ? ((bouncedCount / sentCount) * 100).toFixed(1) : "0.0";

    return {
      campaignId: campaign.id,
      name: campaign.name,
      status: campaign.status,
      totalLeads: campaign._count.campaignLeads,
      sentCount,
      repliedCount,
      bouncedCount,
      unsubscribedCount,
      scheduledCount: campaign._count.scheduledEmails,
      replyRate: `${replyRate}%`,
      bounceRate: `${bounceRate}%`,
    };
  }
}
