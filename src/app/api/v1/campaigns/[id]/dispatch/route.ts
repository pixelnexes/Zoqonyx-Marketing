import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenancy";
import { dbStore, StoredSentEmail } from "@/lib/db-store";
import { SmtpImapProvider } from "@/lib/providers/smtp-imap-provider";
import { renderTemplate } from "@/lib/template-renderer";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const context = await getTenantContext(req);
    const body = await req.json().catch(() => ({}));
    const limit = Number(body.limit) || 25;

    const campaigns = dbStore.getCampaigns();
    const campaign = campaigns.find((c) => c.id === params.id) || campaigns[0];
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const mailboxes = dbStore.getMailboxes();
    const mailbox = mailboxes.find((m) => m.id === campaign.mailboxId) || mailboxes[0];

    // Find candidate leads
    let candidateLeads = dbStore.getLeads({ limit: 1000 }).leads;
    if (campaign.targetListTag) {
      const tagLower = campaign.targetListTag.toLowerCase();
      const filtered = candidateLeads.filter(
        (l) => (l.industry || "").toLowerCase() === tagLower || l.tags?.some((t) => t.toLowerCase() === tagLower)
      );
      if (filtered.length > 0) candidateLeads = filtered;
    }

    const leadsToDispatch = candidateLeads.slice(0, limit);
    if (leadsToDispatch.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No leads available for dispatch in this campaign's target category",
        dispatched: 0,
      });
    }

    const step1 = campaign.sequenceSteps?.[0] || {
      subject: "Partnership Inquiry - {{name}}",
      bodyHtml: "<p>Hi {{first_name}}, wanted to reach out regarding your business growth.</p>",
    };

    const hasLiveSmtp = Boolean(
      mailbox?.credentials?.smtpHost && mailbox?.credentials?.smtpUser && mailbox?.credentials?.smtpPass
    );
    const provider = hasLiveSmtp ? new SmtpImapProvider() : null;

    const dispatchLog: any[] = [];
    let successCount = 0;
    let failedCount = 0;

    for (const lead of leadsToDispatch) {
      const renderedSubject = renderTemplate(step1.subject, {
        firstName: lead.firstName || lead.company?.split(" ")[0] || "Business Owner",
        lastName: lead.lastName || "",
        email: lead.email,
        company: lead.company || "Your Business",
        city: lead.city || "your city",
        jobTitle: lead.jobTitle || "Director",
      });

      const renderedBody = renderTemplate(step1.bodyHtml, {
        firstName: lead.firstName || lead.company?.split(" ")[0] || "Business Owner",
        lastName: lead.lastName || "",
        email: lead.email,
        company: lead.company || "Your Business",
        city: lead.city || "your city",
        jobTitle: lead.jobTitle || "Director",
      });

      let sentStatus: "SENT" | "FAILED" = "SENT";
      let messageId = `<disp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@${mailbox?.email?.split("@")[1] || "zoqonyx.com"}>`;
      let errorMsg: string | undefined = undefined;

      if (hasLiveSmtp && provider) {
        try {
          const res = await provider.sendEmail(mailbox.credentials as any, {
            to: lead.email,
            fromName: mailbox.fromName || "Campaign Outreach",
            fromEmail: mailbox.email,
            subject: renderedSubject,
            htmlBody: `
              ${renderedBody}
              <br/><br/>
              <p style="font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 10px;">
                You received this note from ${mailbox.fromName} (${mailbox.email}). To unsubscribe, click <a href="#">here</a>.
              </p>
            `,
          });
          if (!res.success) {
            sentStatus = "FAILED";
            errorMsg = res.error;
            failedCount++;
          } else {
            messageId = res.messageId || messageId;
            successCount++;
          }
        } catch (e: any) {
          sentStatus = "FAILED";
          errorMsg = e.message;
          failedCount++;
        }
      } else {
        successCount++;
      }

      const logEntry: StoredSentEmail = {
        id: `sent_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        campaignId: campaign.id,
        campaignName: campaign.name,
        mailboxId: mailbox?.id || "mbx_default",
        fromEmail: mailbox?.email || "outreach@zoqonyx.com",
        toEmail: lead.email,
        leadName: `${lead.firstName || ""} ${lead.lastName || ""}`.trim() || lead.company,
        subject: renderedSubject,
        status: sentStatus,
        messageId,
        error: errorMsg,
        sentAt: new Date().toISOString(),
      };

      dbStore.recordSentEmail(logEntry);
      dispatchLog.push({
        toEmail: lead.email,
        leadCompany: lead.company,
        subject: renderedSubject,
        status: sentStatus,
        messageId,
        error: errorMsg,
      });
    }

    return NextResponse.json({
      success: true,
      campaignName: campaign.name,
      senderMailbox: mailbox?.email,
      isLiveSmtp: hasLiveSmtp,
      totalProcessed: leadsToDispatch.length,
      successCount,
      failedCount,
      dispatches: dispatchLog,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}
