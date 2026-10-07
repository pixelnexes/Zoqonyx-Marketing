import { Worker, Job } from "bullmq";
import { redisConnection, QUEUE_NAMES } from "../lib/redis";
import { prisma } from "../lib/prisma";
import { MailboxService } from "../services/mailbox.service";
import { InboxService } from "../services/inbox.service";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";

export function createInboundSyncWorker() {
  const worker = new Worker(
    QUEUE_NAMES.INBOUND_SYNC,
    async (job: Job) => {
      // Find all active mailboxes with SMTP_IMAP provider type
      const mailboxes = await prisma.mailbox.findMany({
        where: {
          status: "ACTIVE",
          providerType: "SMTP_IMAP",
        },
      });

      let syncedCount = 0;

      for (const mailbox of mailboxes) {
        try {
          const creds = await MailboxService.getDecryptedCredentials(mailbox.id);
          if (!creds.imapHost || !creds.imapUser || !creds.imapPass) {
            continue;
          }

          const client = new ImapFlow({
            host: creds.imapHost,
            port: Number(creds.imapPort) || 993,
            secure: creds.imapSecure ?? (Number(creds.imapPort) === 993),
            auth: {
              user: creds.imapUser,
              pass: creds.imapPass,
            },
            logger: false,
          });

          await client.connect();
          const lock = await client.getMailboxLock("INBOX");

          try {
            // Search unseen messages
            const messages = await client.search({ seen: false });
            if (messages && messages.length > 0) {
              for (const uid of messages.slice(-10)) {
                const rawMessage = await client.download(String(uid));
                if (rawMessage && rawMessage.content) {
                  const parsed = await simpleParser(rawMessage.content);

                  const fromAddress = parsed.from?.value[0]?.address || "";
                  const toAddress = mailbox.email;
                  const subject = parsed.subject || "No Subject";
                  const bodyText = parsed.text || "";
                  const inReplyTo = parsed.inReplyTo || undefined;
                  const messageId = parsed.messageId || undefined;

                  if (fromAddress) {
                    await InboxService.processInboundReply({
                      organizationId: mailbox.organizationId,
                      fromEmail: fromAddress,
                      toEmail: toAddress,
                      subject,
                      bodyCleanText: bodyText,
                      bodyHtml: typeof parsed.html === "string" ? parsed.html : undefined,
                      messageId,
                      inReplyTo,
                    });
                  }
                }
              }
            }
          } finally {
            lock.release();
            await client.logout();
          }

          await prisma.mailbox.update({
            where: { id: mailbox.id },
            data: { lastSyncAt: new Date(), lastError: null },
          });

          syncedCount++;
        } catch (err: any) {
          await prisma.mailbox.update({
            where: { id: mailbox.id },
            data: { lastError: err.message },
          });
        }
      }

      return { syncedCount };
    },
    {
      connection: redisConnection,
      concurrency: 1,
    }
  );

  return worker;
}
