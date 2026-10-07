export interface LeadTemplateContext {
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  company?: string | null;
  jobTitle?: string | null;
  phone?: string | null;
  website?: string | null;
  industry?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  customFields?: Record<string, any> | null;
  unsubscribeUrl?: string;
  senderAddress?: string;
  senderName?: string;
}

/**
 * Parses and interpolates template strings with dynamic lead variables.
 * Supports Mustache syntax: {{variable}} and filters: {{variable | fallback:"Default"}}
 * Invariant: Never produces "Hi undefined" or "Hi null"
 */
export function renderTemplate(template: string, context: LeadTemplateContext): string {
  if (!template) return "";

  // Regular expression matching {{ variable | fallback:"val" }} or {{ variable }}
  const variableRegex = /\{\{\s*([a-zA-Z0-9_.]+)(?:\s*\|\s*fallback:\s*(?:"([^"]*)"|'([^']*)'))?\s*\}\}/g;

  return template.replace(variableRegex, (match, varPath, fallbackDouble, fallbackSingle) => {
    const fallback = fallbackDouble ?? fallbackSingle ?? "";
    const value = resolveVariableValue(varPath, context);

    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value);
    }

    return fallback;
  });
}

function resolveVariableValue(path: string, context: LeadTemplateContext): any {
  const normalizedPath = path.toLowerCase().replace(/[_-]/g, "");

  switch (normalizedPath) {
    case "firstname":
    case "first":
    case "name":
      return context.firstName;
    case "lastname":
    case "last":
      return context.lastName;
    case "fullname":
      return [context.firstName, context.lastName].filter(Boolean).join(" ");
    case "email":
      return context.email;
    case "company":
    case "companyname":
      return context.company;
    case "jobtitle":
    case "title":
    case "role":
      return context.jobTitle;
    case "phone":
      return context.phone;
    case "website":
    case "url":
      return context.website;
    case "industry":
      return context.industry;
    case "city":
      return context.city;
    case "state":
      return context.state;
    case "country":
      return context.country;
    case "unsubscribeurl":
      return context.unsubscribeUrl;
    case "senderaddress":
      return context.senderAddress;
    case "sendername":
      return context.senderName;
    default:
      // Check custom fields
      if (context.customFields && typeof context.customFields === "object") {
        if (context.customFields[path] !== undefined) {
          return context.customFields[path];
        }
        // Match case-insensitively
        for (const key of Object.keys(context.customFields)) {
          if (key.toLowerCase().replace(/[_-]/g, "") === normalizedPath) {
            return context.customFields[key];
          }
        }
      }
      return undefined;
  }
}

/**
 * Appends standard CAN-SPAM / GDPR compliant unsubscribe footer if not already present.
 */
export function injectUnsubscribeFooter(
  htmlBody: string,
  unsubscribeUrl: string,
  senderAddress?: string
): string {
  if (!unsubscribeUrl) return htmlBody;

  // If user already embedded {{unsubscribe_url}}, don't double inject
  if (htmlBody.includes(unsubscribeUrl)) {
    return htmlBody;
  }

  const footer = `
<div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <p style="margin: 0 0 8px 0;">${senderAddress ? `Sent by ${senderAddress} • ` : ""}To stop receiving emails, you can <a href="${unsubscribeUrl}" style="color: #0ea5e9; text-decoration: underline;">unsubscribe here</a>.</p>
</div>
`;

  return htmlBody + footer;
}
