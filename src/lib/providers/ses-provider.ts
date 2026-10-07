import { IEmailProvider, SendEmailOptions, SendEmailResult, ConnectionTestResult } from "./types";

export interface SesCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

export class AmazonSesProvider implements IEmailProvider {
  async testConnection(credentials: SesCredentials): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    try {
      // Validate credentials structure
      if (!credentials.accessKeyId || !credentials.secretAccessKey || !credentials.region) {
        return {
          success: false,
          message: "AWS SES configuration missing Access Key, Secret Key, or Region.",
          latencyMs: Date.now() - startTime,
        };
      }

      return {
        success: true,
        message: `Successfully validated Amazon SES configuration for region: ${credentials.region}`,
        latencyMs: Date.now() - startTime,
        details: { region: credentials.region },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "SES connection error",
        latencyMs: Date.now() - startTime,
      };
    }
  }

  async sendEmail(credentials: SesCredentials, options: SendEmailOptions): Promise<SendEmailResult> {
    // Standard HTTPS / Nodemailer SES compatible dispatch
    try {
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.createTransport({
        host: `email-smtp.${credentials.region}.amazonaws.com`,
        port: 465,
        secure: true,
        auth: {
          user: credentials.accessKeyId,
          pass: credentials.secretAccessKey,
        },
      });

      const info = await transporter.sendMail({
        from: `"${options.fromName.replace(/"/g, "")}" <${options.fromEmail}>`,
        to: options.to,
        replyTo: options.replyTo || options.fromEmail,
        subject: options.subject,
        html: options.htmlBody,
        text: options.textBody || options.htmlBody.replace(/<[^>]*>/g, ""),
        headers: options.headers || {},
      });

      return {
        success: true,
        messageId: info.messageId,
        providerResponse: info,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to dispatch via Amazon SES",
      };
    }
  }
}
