import { prisma } from "../lib/prisma";
import { LeadStatus, CampaignLeadStatus } from "@prisma/client";
import { MailboxService } from "./mailbox.service";
import { ProviderFactory } from "../lib/providers/provider-factory";

export class InboxService {
  /**
   * Retrieves conversation threads with filtering and pagination.
   */
  static async getConversations(
    organizationId: string,
    options: {
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = { organizationId };

    if (options.status && options.status !== "ALL") {
      where.status = options.status;
    }

    if (options.search) {
      const s = options.search.trim();
      where.OR = [
        { subject: { contains: s, mode: "insensitive" } },
        { snippet: { contains: s, mode: "insensitive" } },
        { lead: { email: { contains: s, mode: "insensitive" } } },
        { lead: { firstName: { contains: s, mode: "insensitive" } } },
        { lead: { lastName: { contains: s, mode: "insensitive" } } },
        { lead: { company: { contains: s, mode: "insensitive" } } },
      ];
    }

    const [total, conversations] = await Promise.all([
      prisma.conversation.count({ where }),
      prisma.conversation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { lastActivityAt: "desc" },
        include: {
          lead: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              company: true,
              jobTitle: true,
              status: true,
            },
          },
          campaign: {
            select: { id: true, name: true },
          },
          mailbox: {
            select: { id: true, email: true, fromName: true },
          },
          _count: {
            select: { inboundEmails: true },
          },
        },
      }),
    ]);

    return {
      conversations,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieves complete conversation thread history with inbound and outbound messages.
   */
  static async getConversationDetails(conversationId: string, organizationId: string) {
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, organizationId },
      include: {
        lead: true,
        campaign: true,
        mailbox: true,
        inboundEmails: {
          orderBy: { receivedAt: "asc" },
        },
      },
    });

    if (!conversation) throw new Error("Conversation not found");

    // Fetch sent emails for this lead and campaign
    const sentEmails = await prisma.sentEmail.findMany({
      where: {
        organizationId,
        leadId: conversation.leadId,
        ...(conversation.campaignId ? { campaignId: conversation.campaignId } : {}),
      },
      orderBy: { sentAt: "asc" },
    });

    return {
      conversation,
      sentEmails,
    };
  }

  /**
   * Core Reply Processing: Transactionally detects replies, updates lead status, halts future follow-ups.
   */
  static async processInboundReply(params: {
    organizationId: string;
    fromEmail: string;
    toEmail: string;
    subject: string;
    bodyCleanText: string;
    bodyHtml?: string;
    messageId?: string;
    inReplyTo?: string;
    rawHeaders?: any;
  }) {
    const cleanFrom = params.fromEmail.toLowerCase().trim();

    // 1. Locate matching lead
    const lead = await prisma.lead.findFirst({
      where: { organizationId: params.organizationId, email: cleanFrom },
    });
    if (!lead) return null;

    // 2. Locate matching sent email or campaign
    let sentEmail = null;
    if (params.inReplyTo) {
      sentEmail = await prisma.sentEmail.findFirst({
        where: { messageId: params.inReplyTo, organizationId: params.organizationId },
      });
    }

    if (!sentEmail) {
      // Find most recent sent email to this lead
      sentEmail = await prisma.sentEmail.findFirst({
        where: { leadId: lead.id, organizationId: params.organizationId },
        orderBy: { sentAt: "desc" },
      });
    }

    const campaignId = sentEmail?.campaignId || null;
    const mailboxId = sentEmail?.mailboxId || (await prisma.mailbox.findFirst({
      where: { organizationId: params.organizationId, email: params.toEmail.toLowerCase().trim() },
    }))?.id;

    if (!mailboxId) return null;

    // 3. Update Lead Status to REPLIED
    await prisma.lead.update({
      where: { id: lead.id },
      data: { status: LeadStatus.REPLIED },
    });

    // 4. Update CampaignLead Status to REPLIED and cancel pending scheduled steps
    if (campaignId) {
      await prisma.campaignLead.updateMany({
        where: { campaignId, leadId: lead.id },
        data: { status: CampaignLeadStatus.REPLIED },
      });

      await prisma.scheduledEmail.updateMany({
        where: { campaignId, leadId: lead.id, status: "PENDING" },
        data: { status: "CANCELLED", errorMessage: "Sequence stopped: Prospect replied" },
      });
    }

    // 5. Upsert Conversation Thread
    const conversation = await prisma.conversation.upsert({
      where: {
        id: (await prisma.conversation.findFirst({
          where: { organizationId: params.organizationId, leadId: lead.id },
          select: { id: true },
        }))?.id || "non-existent-uuid",
      },
      create: {
        organizationId: params.organizationId,
        leadId: lead.id,
        campaignId,
        mailboxId,
        subject: params.subject,
        snippet: params.bodyCleanText.substring(0, 200),
        status: "REPLIED",
        lastActivityAt: new Date(),
      },
      update: {
        subject: params.subject,
        snippet: params.bodyCleanText.substring(0, 200),
        status: "REPLIED",
        lastActivityAt: new Date(),
      },
    });

    // 6. Record InboundEmail entry
    await prisma.inboundEmail.create({
      data: {
        conversationId: conversation.id,
        sentEmailId: sentEmail?.id || null,
        fromEmail: cleanFrom,
        toEmail: params.toEmail,
        subject: params.subject,
        bodyCleanText: params.bodyCleanText,
        bodyHtml: params.bodyHtml || null,
        rawHeaders: params.rawHeaders || {},
        messageId: params.messageId || null,
      },
    });

    return conversation;
  }

  /**
   * Dispatches manual reply directly from the unified inbox.
   */
  static async sendDirectReply(
    conversationId: string,
    organizationId: string,
    messageHtml: string,
    subject?: string
  ) {
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, organizationId },
      include: {
        lead: true,
        mailbox: true,
      },
    });
    if (!conversation) throw new Error("Conversation not found");

    const creds = await MailboxService.getDecryptedCredentials(conversation.mailbox.id);
    const provider = ProviderFactory.getProvider(conversation.mailbox.providerType);

    const replySubject = subject || (conversation.subject.startsWith("Re:") ? conversation.subject : `Re: ${conversation.subject}`);

    const result = await provider.sendEmail(creds, {
      to: conversation.lead.email,
      fromName: conversation.mailbox.fromName,
      fromEmail: conversation.mailbox.email,
      replyTo: conversation.mailbox.replyToEmail || conversation.mailbox.email,
      subject: replySubject,
      htmlBody: messageHtml,
    });

    if (!result.success) {
      throw new Error(`Failed to send reply: ${result.error}`);
    }

    // Record as SentEmail
    await prisma.sentEmail.create({
      data: {
        organizationId,
        campaignId: conversation.campaignId || "manual-inbox-reply",
        leadId: conversation.lead.id,
        sequenceStepId: "manual-inbox-step",
        mailboxId: conversation.mailbox.id,
        messageId: result.messageId || null,
        idempotencyKey: `inbox-reply-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        toEmail: conversation.lead.email,
        fromEmail: conversation.mailbox.email,
        subject: replySubject,
        bodyHtml: messageHtml,
      },
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastActivityAt: new Date() },
    });

    return result;
  }
}
