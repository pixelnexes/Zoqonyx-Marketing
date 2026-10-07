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
export async function validateEmailDomain(email: string): Promise<EmailValidationResult> {
  if (!email || typeof email !== "string") {
    return { valid: false, reason: "Empty or invalid email string" };
  }

  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  if (!emailRegex.test(trimmed)) {
    return { valid: false, reason: "Malformed email syntax format" };
  }

  const parts = trimmed.split("@");
  if (parts.length !== 2) {
    return { valid: false, reason: "Invalid @ structure" };
  }

  const domain = parts[1];

  // Disallow known dummy placeholder test domains
  const dummyDomains = ["example.com", "test.com", "domain.com", "sample.org", "fake.com", "mysite.com"];
  if (dummyDomains.includes(domain)) {
    return { valid: false, domain, reason: `Placeholder domain (${domain}) is not a real recipient` };
  }

  try {
    // 1. Check if domain has active MX records
    const mxRecords = await dns.resolveMx(domain).catch(() => []);
    if (mxRecords && mxRecords.length > 0) {
      return { valid: true, domain };
    }

    // 2. Fallback check for A record (some old mail exchangers accept mail at apex A record)
    const aRecords = await dns.resolve4(domain).catch(() => []);
    if (aRecords && aRecords.length > 0) {
      return { valid: true, domain };
    }

    return {
      valid: false,
      domain,
      reason: `Domain "${domain}" has no active DNS or MX records (Dead/Unreachable Host). Sending will cause bounce.`,
    };
  } catch (err: any) {
    return {
      valid: false,
      domain,
      reason: `DNS verification failed for domain "${domain}": ${err.code || err.message}`,
    };
  }
}
