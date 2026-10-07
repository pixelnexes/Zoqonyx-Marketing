declare module 'mailparser' {
  export interface ParsedMail {
    text?: string;
    html?: string | boolean;
    textAsHtml?: string;
    subject?: string;
    from?: {
      value: Array<{
        address?: string;
        name?: string;
      }>;
      text: string;
    };
    to?: {
      value: Array<{
        address?: string;
        name?: string;
      }>;
      text: string;
    };
    messageId?: string;
    inReplyTo?: string;
    references?: string | string[];
    date?: Date;
  }

  export function simpleParser(
    input: any,
    options?: any
  ): Promise<ParsedMail>;
}
