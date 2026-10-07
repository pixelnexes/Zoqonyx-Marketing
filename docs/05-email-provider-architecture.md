# ZOQONYX EMAIL MARKETING - Email Provider Architecture & Abstraction Layer

**Product Name:** Zoqonyx Email Marketing  
**Developer:** Nawix Tech Solution ([https://newixtechsolutions.com/](https://newixtechsolutions.com/))  
**Document Code:** `DOC-05-PROVIDER`  

---

## 1. Design Goal & Provider-Agnostic Interface

Zoqonyx Email Marketing does **not** hardcode a single email vendor. The system encapsulates email transport mechanisms behind a unified TypeScript interface: `IEmailProvider`.

Adding a new provider (e.g. Resend, Brevo, Sendinblue, Scaleway) requires only creating an adapter class that adheres to this contract without touching core sequence scheduling or campaign logic.

```typescript
export interface SendEmailOptions {
  to: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  trackingHeaders?: Record<string, string>;
  customHeaders?: Record<string, string>;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  providerResponse?: any;
  error?: string;
  statusCode?: number;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  latencyMs?: number;
  details?: Record<string, any>;
}

export interface IEmailProvider {
  /**
   * Validates credentials and verifies network connectivity.
   */
  testConnection(credentials: any): Promise<ConnectionTestResult>;

  /**
   * Dispatches a single formatted email message through provider.
   */
  sendEmail(credentials: any, options: SendEmailOptions): Promise<SendEmailResult>;

  /**
   * Retrieves provider-reported daily or rate limits if available.
   */
  getLimits?(credentials: any): Promise<{ dailyLimit?: number; remainingToday?: number }>;

  /**
   * Normalizes incoming provider webhooks (delivered, bounced, complained).
   */
  parseWebhookEvent?(payload: any, signatureHeaders?: any): NormalizedWebhookEvent | null;
}
```

---

## 2. Supported Provider Implementations

### 2.1. Standard SMTP / IMAP Provider (`SmtpImapProvider`)
- **Transport:** Node.js `nodemailer` with pooling and keep-alive connections.
- **Security:** Supports `STARTTLS` (Port 587), `SSL/TLS` (Port 465), or plain unencrypted (Port 25, local dev only).
- **Inbound Reply Monitoring:** High-performance IMAP sync poller checking `UNSEEN` messages, parsing RFC822 headers, extracting clean text and thread Message-IDs.
- **Preset Configurations:** Built-in auto-fill guidance for popular providers (Google Workspace, Microsoft 365, Hostinger, Namecheap, Zoho Mail, cPanel).

### 2.2. Mailgun API Provider (`MailgunProvider`)
- **Transport:** Official Mailgun REST API (US & EU regions supported).
- **Features:** Direct domain validation, sending status inspection, automated tag assignment, native bounce/unsubscribe tracking.
- **Webhook Security:** Cryptographic signature verification using Mailgun Webhook Signing Key (HMAC-SHA256).

### 2.3. Amazon SES Provider (`AmazonSesProvider`)
- **Transport:** AWS SDK v3 (`@aws-sdk/client-ses`).
- **Features:** High-throughput dispatch, IAM role or access/secret key authentication, SNS topic webhook routing for bounce and complaint handling.

### 2.4. SendGrid & Postmark Providers
- RESTful HTTP dispatch with API key bearer tokens, template tags, and standardized bounce mapping.

---

## 3. Credential Encryption & Hardware Vault

To satisfy enterprise security compliance, raw mailbox credentials (SMTP passwords, Mailgun API keys, SES secret keys) are **never** stored in plaintext.

- **Algorithm:** AES-256-GCM (Galois/Counter Mode) authenticated encryption.
- **Key Derivation:** Master encryption key supplied via `ENCRYPTION_MASTER_KEY` environment variable.
- **Storage Model:** Each credential record stores `encryptedPayload`, `iv` (12-byte random), and `authTag` (16-byte authentication tag).
- **Masking:** API responses and administrative dashboards return masked indicators (e.g. `mai_***...xyz`) and never expose the cleartext secret.
