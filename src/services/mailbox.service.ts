import { prisma } from "../lib/prisma";
import { encryptSecret, decryptSecret, maskSecret } from "../lib/encryption";
import { ProviderFactory } from "../lib/providers/provider-factory";
import { ProviderType, MailboxStatus } from "@prisma/client";
import { auditDomainDeliverability } from "../lib/deliverability";

export class MailboxService {
  /**
   * Connects and validates a new mailbox with encrypted credential storage.
   */
  static async connectMailbox(
    organizationId: string,
    data: {
      email: string;
      fromName: string;
      replyToEmail?: string;
      providerType: ProviderType;
      dailyLimit?: number;
      credentials: Record<string, any>;
    }
  ) {
    const cleanEmail = data.email.toLowerCase().trim();
    const provider = ProviderFactory.getProvider(data.providerType);

    // 1. Verify credentials live
    const testResult = await provider.testConnection(data.credentials);
    if (!testResult.success) {
      throw new Error(`Connection verification failed: ${testResult.message}`);
    }

    // 2. Encrypt credentials
    const encrypted = encryptSecret(data.credentials);

    // 3. Extract domain and check DNS
    const domain = cleanEmail.split("@")[1];
    let dnsResult = { spfValid: false, dkimValid: false, dmarcValid: false };
    if (domain) {
      try {
        dnsResult = await auditDomainDeliverability(domain);
      } catch {}
    }

    // 4. Create or update mailbox transactionally
    const mailbox = await prisma.mailbox.upsert({
      where: {
        organizationId_email: { organizationId, email: cleanEmail },
      },
      create: {
        organizationId,
        email: cleanEmail,
        fromName: data.fromName,
        replyToEmail: data.replyToEmail || null,
        providerType: data.providerType,
        dailyLimit: data.dailyLimit || 100,
        status: MailboxStatus.ACTIVE,
        spfValid: dnsResult.spfValid,
        dkimValid: dnsResult.dkimValid,
        dmarcValid: dnsResult.dmarcValid,
        credential: {
          create: {
            encryptedPayload: encrypted.encryptedPayload,
            iv: encrypted.iv,
            authTag: encrypted.authTag,
          },
        },
      },
      update: {
        fromName: data.fromName,
        replyToEmail: data.replyToEmail || null,
        providerType: data.providerType,
        dailyLimit: data.dailyLimit || 100,
        status: MailboxStatus.ACTIVE,
        lastError: null,
        spfValid: dnsResult.spfValid,
        dkimValid: dnsResult.dkimValid,
        dmarcValid: dnsResult.dmarcValid,
        credential: {
          upsert: {
            create: {
              encryptedPayload: encrypted.encryptedPayload,
              iv: encrypted.iv,
              authTag: encrypted.authTag,
            },
            update: {
              encryptedPayload: encrypted.encryptedPayload,
              iv: encrypted.iv,
              authTag: encrypted.authTag,
            },
          },
        },
      },
      include: {
        credential: true,
      },
    });

    return {
      id: mailbox.id,
      email: mailbox.email,
      fromName: mailbox.fromName,
      providerType: mailbox.providerType,
      status: mailbox.status,
      spfValid: mailbox.spfValid,
      dkimValid: mailbox.dkimValid,
      dmarcValid: mailbox.dmarcValid,
    };
  }

  /**
   * Retrieves decrypted credentials for worker dispatch. (Never exposed to API responses).
   */
  static async getDecryptedCredentials(mailboxId: string) {
    const credRecord = await prisma.providerCredential.findUnique({
      where: { mailboxId },
    });
    if (!credRecord) throw new Error("Mailbox credentials not found");

    return decryptSecret<Record<string, any>>({
      encryptedPayload: credRecord.encryptedPayload,
      iv: credRecord.iv,
      authTag: credRecord.authTag,
    });
  }

  /**
   * Sends a test email to verify end-to-end inbox delivery.
   */
  static async sendTestEmail(
    mailboxId: string,
    organizationId: string,
    recipientEmail: string
  ) {
    const mailbox = await prisma.mailbox.findFirst({
      where: { id: mailboxId, organizationId },
    });
    if (!mailbox) throw new Error("Mailbox not found");

    const credentials = await this.getDecryptedCredentials(mailbox.id);
    const provider = ProviderFactory.getProvider(mailbox.providerType);

    const result = await provider.sendEmail(credentials, {
      to: recipientEmail,
      fromName: mailbox.fromName,
      fromEmail: mailbox.email,
      replyTo: mailbox.replyToEmail || mailbox.email,
      subject: `[Zoqonyx Test] Verification for ${mailbox.email}`,
      htmlBody: `
        <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
          <h2 style="color: #0ea5e9;">Zoqonyx Mailbox Verification Successful</h2>
          <p>This is a live test dispatch from your connected mailbox: <strong>${mailbox.email}</strong></p>
          <p>Provider Adapter: <code>${mailbox.providerType}</code></p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <small style="color: #64748b;">Powered by Zoqonyx Email Marketing • Nawix Tech Solution</small>
        </div>
      `,
    });

    return result;
  }

  /**
   * Lists organization mailboxes with masked credentials for UI.
   */
  static async listMailboxes(organizationId: string) {
    const mailboxes = await prisma.mailbox.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            campaigns: true,
            sentEmails: true,
          },
        },
      },
    });

    return mailboxes.map((m) => ({
      id: m.id,
      email: m.email,
      fromName: m.fromName,
      replyToEmail: m.replyToEmail,
      providerType: m.providerType,
      status: m.status,
      dailyLimit: m.dailyLimit,
      sentToday: m.sentToday,
      spfValid: m.spfValid,
      dkimValid: m.dkimValid,
      dmarcValid: m.dmarcValid,
      lastSyncAt: m.lastSyncAt,
      lastError: m.lastError,
      activeCampaigns: m._count.campaigns,
      totalSent: m._count.sentEmails,
    }));
  }
}
