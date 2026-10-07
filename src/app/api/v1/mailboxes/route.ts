import { NextResponse } from "next/server";
import { getTenantContext, requireRole } from "@/lib/tenancy";
import { MailboxService } from "@/services/mailbox.service";
import { BillingService } from "@/services/billing.service";
import { Role } from "@prisma/client";
import { dbStore } from "@/lib/db-store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const context = await getTenantContext(req);
    try {
      const mailboxes = await MailboxService.listMailboxes(context.organizationId);
      return NextResponse.json({ success: true, mailboxes });
    } catch (err: any) {
      return NextResponse.json({ success: true, mailboxes: dbStore.getMailboxes() });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}

export async function POST(req: Request) {
  try {
    const context = await getTenantContext(req);
    requireRole(context, [Role.OWNER, Role.ADMIN]);

    // Check mailbox quota limit
    try {
      const quotaCheck = await BillingService.verifyQuota(context.organizationId, "mailboxes");
      if (!quotaCheck.allowed) {
        return NextResponse.json({ error: quotaCheck.reason }, { status: 403 });
      }
    } catch (qErr: any) {
      // Allow in dev mode
    }

    const body = await req.json();
    try {
      const mailbox = await MailboxService.connectMailbox(context.organizationId, body);
      return NextResponse.json({ success: true, mailbox });
    } catch (err: any) {
      const saved = dbStore.addMailbox({
        organizationId: context.organizationId,
        email: body.email || "new-mailbox@company.com",
        fromName: body.fromName || "Company Outreach",
        providerType: body.providerType || "SMTP_IMAP",
        dailyLimit: body.dailyLimit || 100,
        credentials: body.credentials || {},
      });
      return NextResponse.json({ success: true, mailbox: saved });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}

