import { ProviderType } from "@prisma/client";
import { IEmailProvider } from "./types";
import { SmtpImapProvider } from "./smtp-imap-provider";
import { MailgunProvider } from "./mailgun-provider";
import { AmazonSesProvider } from "./ses-provider";

export class ProviderFactory {
  private static providers: Map<ProviderType, IEmailProvider> = new Map();

  static getProvider(type: ProviderType): IEmailProvider {
    if (!this.providers.has(type)) {
      switch (type) {
        case ProviderType.MAILGUN:
          this.providers.set(type, new MailgunProvider());
          break;
        case ProviderType.AMAZON_SES:
          this.providers.set(type, new AmazonSesProvider());
          break;
        case ProviderType.SMTP_IMAP:
        case ProviderType.GOOGLE_WORKSPACE:
        case ProviderType.MICROSOFT_365:
        case ProviderType.SENDGRID:
        case ProviderType.POSTMARK:
        default:
          this.providers.set(type, new SmtpImapProvider());
          break;
      }
    }

    return this.providers.get(type)!;
  }
}
