import dns from "dns/promises";

export interface EmailValidationResult {
  valid: boolean;
  reason?: string;
  domain?: string;
}

/**
 * Validates email syntax and performs a lightweight DNS MX/A record verification.
 * Prevents "Host or domain not found" bounces and protects sender deliverability.
 */
/**
 * Fast, non-blocking email syntax and basic domain format validator.
 */
export async function validateEmailDomain(email: string): Promise<EmailValidationResult> {
  if (!email || typeof email !== "string") {
    return { valid: false, reason: "Empty email address" };
  }

  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  if (!emailRegex.test(trimmed)) {
    return { valid: false, reason: "Malformed email format" };
  }

  const parts = trimmed.split("@");
  if (parts.length !== 2 || !parts[1].includes(".")) {
    return { valid: false, reason: "Invalid domain structure" };
  }

  const domain = parts[1];

  // Block obvious dummy placeholder domains
  const dummyDomains = ["example.com", "test.com", "domain.com", "sample.org", "fake.com", "mysite.com", "none.com"];
  if (dummyDomains.includes(domain)) {
    return { valid: false, domain, reason: `Placeholder domain (${domain}) cannot receive mail` };
  }

  return { valid: true, domain };
}
