import { describe, it, expect } from "vitest";
import { generateDispatchIdempotencyKey } from "../../src/lib/idempotency";

describe("Idempotency Unit Tests", () => {
  it("generates deterministic SHA-256 idempotency key", () => {
    const key1 = generateDispatchIdempotencyKey("cmp-123", "lead-456", 1);
    const key2 = generateDispatchIdempotencyKey("cmp-123", "lead-456", 1);
    expect(key1).toBe(key2);
    expect(key1.length).toBe(64); // 256-bit hex
  });

  it("produces distinct keys for different sequence steps or leads", () => {
    const step1Key = generateDispatchIdempotencyKey("cmp-123", "lead-456", 1);
    const step2Key = generateDispatchIdempotencyKey("cmp-123", "lead-456", 2);
    const otherLeadKey = generateDispatchIdempotencyKey("cmp-123", "lead-999", 1);

    expect(step1Key).not.toBe(step2Key);
    expect(step1Key).not.toBe(otherLeadKey);
  });
});
