import nodemailer from "nodemailer";
import { IEmailProvider, SendEmailOptions, SendEmailResult, ConnectionTestResult } from "./types";

export interface SmtpCredentials {
  smtpHost: string;
  smtpPort: number;
  smtpSecure?: boolean; // true for 465, false for other ports
  smtpUser: string;
  smtpPass: string;
  imapHost?: string;
  imapPort?: number;
  imapSecure?: boolean;
  imapUser?: string;
  imapPass?: string;
}

export class SmtpImapProvider implements IEmailProvider {
  async testConnection(credentials: SmtpCredentials): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    try {
      const transporter = nodemailer.createTransport({
        host: credentials.smtpHost,
        port: Number(credentials.smtpPort),
        secure: credentials.smtpSecure ?? (Number(credentials.smtpPort) === 465),
        auth: {
          user: credentials.smtpUser,
          pass: credentials.smtpPass,
        },
        connectionTimeout: 8000,
        greetingTimeout: 5000,
        socketTimeout: 8000,
        tls: {
          rejectUnauthorized: false, // Prevents self-signed cert blocks on custom enterprise mail servers
        },
      });

      await transporter.verify();
      const latencyMs = Date.now() - startTime;

      return {
        success: true,
        message: `Successfully connected to SMTP server ${credentials.smtpHost}:${credentials.smtpPort}`,
        latencyMs,
        details: {
          host: credentials.smtpHost,
          port: credentials.smtpPort,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Failed to establish SMTP handshake",
        latencyMs: Date.now() - startTime,
        details: {
          code: error.code,
          response: error.response,
        },
      };
    }
  }

  async sendEmail(credentials: SmtpCredentials, options: SendEmailOptions): Promise<SendEmailResult> {
    try {
      const transporter = nodemailer.createTransport({
        host: credentials.smtpHost,
        port: Number(credentials.smtpPort),
        secure: credentials.smtpSecure ?? (Number(credentials.smtpPort) === 465),
        auth: {
          user: credentials.smtpUser,
          pass: credentials.smtpPass,
        },
        connectionTimeout: 10000,
        tls: {
          rejectUnauthorized: false,
        },
      });

      const mailOptions = {
        from: `"${options.fromName.replace(/"/g, "")}" <${options.fromEmail}>`,
        to: options.to,
        replyTo: options.replyTo || options.fromEmail,
        subject: options.subject,
        html: options.htmlBody,
        text: options.textBody || options.htmlBody.replace(/<[^>]*>/g, ""),
        headers: options.headers || {},
      };

      const info = await transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: info.messageId,
        providerResponse: {
          response: info.response,
          accepted: info.accepted,
          rejected: info.rejected,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to dispatch email via SMTP",
        providerResponse: error,
      };
    }
  }
}
