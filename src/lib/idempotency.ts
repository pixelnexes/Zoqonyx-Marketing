import crypto from "crypto";

/**
 * Generates a deterministic SHA-256 idempotency key for an email dispatch job.
 * Guaranteed uniqueness per campaign, lead, and sequence step index.
 */
export function generateDispatchIdempotencyKey(
  campaignId: string,
  leadId: string,
  stepNumber: number
): string {
  const raw = `${campaignId}:${leadId}:${stepNumber}`;
  return crypto.createHash("sha256").update(raw).digest("hex");
}
