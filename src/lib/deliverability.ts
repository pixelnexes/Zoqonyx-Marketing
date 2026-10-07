import dns from "dns/promises";

export interface DeliverabilityStatus {
  domain: string;
  spfValid: boolean;
  spfRecord?: string;
  dkimValid: boolean;
  dkimRecord?: string;
  dmarcValid: boolean;
  dmarcRecord?: string;
  overallScore: number; // 0 to 100
  recommendations: string[];
}

/**
 * Performs DNS inspection for domain authentication (SPF, DKIM, DMARC).
 */
export async function auditDomainDeliverability(
  domain: string,
  dkimSelector: string = "k1"
): Promise<DeliverabilityStatus> {
  const cleanDomain = domain.replace(/^@/, "").trim().toLowerCase();
  const recommendations: string[] = [];
  let score = 0;

  // 1. Audit SPF
  let spfValid = false;
  let spfRecord: string | undefined;
  try {
    const txtRecords = await dns.resolveTxt(cleanDomain);
    const flattened = txtRecords.map((r) => r.join(""));
    const spf = flattened.find((r) => r.startsWith("v=spf1"));
    if (spf) {
      spfValid = true;
      spfRecord = spf;
      score += 35;
    } else {
      recommendations.push(
        `Missing SPF record. Add a TXT record for "${cleanDomain}" with value: "v=spf1 include:_spf.google.com ~all" (or your provider's SPF).`
      );
    }
  } catch (error) {
    recommendations.push(`Could not resolve SPF TXT records for ${cleanDomain}.`);
  }

  // 2. Audit DMARC
  let dmarcValid = false;
  let dmarcRecord: string | undefined;
  try {
    const dmarcHost = `_dmarc.${cleanDomain}`;
    const txtRecords = await dns.resolveTxt(dmarcHost);
    const flattened = txtRecords.map((r) => r.join(""));
    const dmarc = flattened.find((r) => r.startsWith("v=DMARC1"));
    if (dmarc) {
      dmarcValid = true;
      dmarcRecord = dmarc;
      score += 35;
    } else {
      recommendations.push(
        `Missing DMARC policy. Add a TXT record for "_dmarc.${cleanDomain}" with value: "v=DMARC1; p=none; sp=none; aspf=r;"`
      );
    }
  } catch (error) {
    recommendations.push(`Missing DMARC record at _dmarc.${cleanDomain}.`);
  }

  // 3. Audit DKIM (Check common selectors)
  let dkimValid = false;
  let dkimRecord: string | undefined;
  const selectorsToTest = [dkimSelector, "google", "default", "mail", "s1", "smtp", "k1"];

  for (const selector of selectorsToTest) {
    try {
      const dkimHost = `${selector}._domainkey.${cleanDomain}`;
      const txtRecords = await dns.resolveTxt(dkimHost);
      const flattened = txtRecords.map((r) => r.join(""));
      const dkim = flattened.find((r) => r.includes("v=DKIM1") || r.includes("p="));
      if (dkim) {
        dkimValid = true;
        dkimRecord = `${selector}._domainkey: ${dkim.substring(0, 40)}...`;
        score += 30;
        break;
      }
    } catch {
      // Continue to next selector
    }
  }

  if (!dkimValid) {
    recommendations.push(
      `No active DKIM selector verified. Generate a DKIM key in your email provider and publish the public key in your DNS TXT records.`
    );
  }

  return {
    domain: cleanDomain,
    spfValid,
    spfRecord,
    dkimValid,
    dkimRecord,
    dmarcValid,
    dmarcRecord,
    overallScore: Math.min(100, score),
    recommendations,
  };
}
