import { IEmailProvider, SendEmailOptions, SendEmailResult, ConnectionTestResult } from "./types";

export interface MailgunCredentials {
  apiKey: string;
  domain: string;
  region?: "us" | "eu";
}

export class MailgunProvider implements IEmailProvider {
  private getBaseUrl(region?: "us" | "eu"): string {
    return region === "eu" ? "https://api.eu.mailgun.net/v3" : "https://api.mailgun.net/v3";
  }

  async testConnection(credentials: MailgunCredentials): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    try {
      const baseUrl = this.getBaseUrl(credentials.region);
      const auth = Buffer.from(`api:${credentials.apiKey}`).toString("base64");

      const response = await fetch(`${baseUrl}/domains/${credentials.domain}`, {
        method: "GET",
        headers: {
          Authorization: `Basic ${auth}`,
        },
      });

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          message: errorData.message || `Mailgun API error (${response.status}: ${response.statusText})`,
          latencyMs,
          details: errorData,
        };
      }

      const domainData = await response.json();
      return {
        success: true,
        message: `Successfully connected to Mailgun domain: ${credentials.domain}`,
        latencyMs,
        details: {
          state: domainData.domain?.state,
          spamAction: domainData.domain?.spam_action,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Failed to reach Mailgun API",
        latencyMs: Date.now() - startTime,
      };
    }
  }

  async sendEmail(credentials: MailgunCredentials, options: SendEmailOptions): Promise<SendEmailResult> {
    try {
      const baseUrl = this.getBaseUrl(credentials.region);
      const auth = Buffer.from(`api:${credentials.apiKey}`).toString("base64");

      const formData = new URLSearchParams();
      formData.append("from", `${options.fromName} <${options.fromEmail}>`);
      formData.append("to", options.to);
      formData.append("subject", options.subject);
      formData.append("html", options.htmlBody);
      if (options.textBody) {
        formData.append("text", options.textBody);
      }
      if (options.replyTo) {
        formData.append("h:Reply-To", options.replyTo);
      }

      // Add custom tracking headers
      if (options.headers) {
        for (const [key, value] of Object.entries(options.headers)) {
          formData.append(`h:${key}`, value);
        }
      }

      const response = await fetch(`${baseUrl}/${credentials.domain}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          success: false,
          error: responseData.message || `Mailgun dispatch error (${response.status})`,
          statusCode: response.status,
          providerResponse: responseData,
        };
      }

      return {
        success: true,
        messageId: responseData.id,
        providerResponse: responseData,
        statusCode: response.status,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Network exception sending via Mailgun",
      };
    }
  }
}
