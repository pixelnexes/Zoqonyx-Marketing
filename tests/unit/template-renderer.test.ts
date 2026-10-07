import { describe, it, expect } from "vitest";
import { renderTemplate, injectUnsubscribeFooter } from "../../src/lib/template-renderer";

describe("TemplateRenderer Unit Tests", () => {
  it("interpolates standard lead variables accurately", () => {
    const template = "Hi {{first_name}}, welcome to {{company_name}} in {{city}}!";
    const context = {
      email: "jane@clinic.org",
      firstName: "Jane",
      company: "Apex Health",
      city: "Austin",
    };

    const result = renderTemplate(template, context);
    expect(result).toBe("Hi Jane, welcome to Apex Health in Austin!");
  });

  it("applies default fallback values when variables are missing", () => {
    const template = "Hello {{first_name | fallback:'there'}}, we noticed {{company_name | fallback:'your practice'}} expanding.";
    const context = {
      email: "unknown@example.com",
      firstName: null,
      company: undefined,
    };

    const result = renderTemplate(template, context);
    expect(result).toBe("Hello there, we noticed your practice expanding.");
  });

  it("never renders 'Hi undefined' or 'Hi null'", () => {
    const template = "Hi {{first_name}} {{last_name}}";
    const context = {
      email: "test@example.com",
    };

    const result = renderTemplate(template, context);
    expect(result).not.toContain("undefined");
    expect(result).not.toContain("null");
    expect(result).toBe("Hi  ");
  });

  it("injects compliant unsubscribe footer into HTML body", () => {
    const html = "<p>Outreach message body</p>";
    const unsubscribeUrl = "https://zoqonyx.com/unsubscribe/tok_123";

    const result = injectUnsubscribeFooter(html, unsubscribeUrl);
    expect(result).toContain(unsubscribeUrl);
    expect(result).toContain("unsubscribe here");
  });
});
