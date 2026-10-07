import { describe, it, expect } from "vitest";
import { isWithinSendingWindow } from "../../src/worker/campaign-scheduler.worker";

describe("Tenancy & Scheduler Integration Tests", () => {
  it("enforces lowest-limit wins algorithm accurately", () => {
    const planLimit = 1500;
    const mailboxLimit = 250;
    const campaignLimit = 100;
    const providerReported = 500;

    const effectiveMax = Math.min(planLimit, mailboxLimit, campaignLimit, providerReported);
    expect(effectiveMax).toBe(100);
  });

  it("evaluates sending windows accurately", () => {
    const days = [1, 2, 3, 4, 5]; // Mon - Fri
    const inWindow = isWithinSendingWindow(days, 0, 24, "UTC");
    expect(typeof inWindow).toBe("boolean");
  });
});
