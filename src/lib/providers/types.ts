export interface SendEmailOptions {
  to: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string | null;
  subject: string;
  htmlBody: string;
  textBody?: string;
  headers?: Record<string, string>;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  providerResponse?: any;
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
   * Tests connection, socket handshake, or API key validation.
   */
  testConnection(credentials: any): Promise<ConnectionTestResult>;

  /**
   * Dispatches a single formatted email.
   */
  sendEmail(credentials: any, options: SendEmailOptions): Promise<SendEmailResult>;

  /**
   * Optional method to fetch mailbox/provider daily or burst limits.
   */
  getLimits?(credentials: any): Promise<{ dailyLimit?: number; remainingToday?: number }>;
}
