import { describe, it, expect } from "vitest";
import { encryptSecret, decryptSecret, maskSecret } from "../../src/lib/encryption";

describe("AES-256-GCM Vault Unit Tests", () => {
  it("encrypts and decrypts string secrets symmetrically", () => {
    const original = "my-super-secret-smtp-password-123!";
    const encrypted = encryptSecret(original);

    expect(encrypted.encryptedPayload).not.toBe(original);
    expect(encrypted.iv).toBeDefined();
    expect(encrypted.authTag).toBeDefined();

    const decrypted = decryptSecret<string>(encrypted);
    expect(decrypted).toBe(original);
  });

  it("encrypts and decrypts structured JSON credentials", () => {
    const creds = {
      smtpHost: "smtp.mailgun.org",
      smtpPort: 587,
      apiKey: "key-9988112233",
    };

    const encrypted = encryptSecret(creds);
    const decrypted = decryptSecret<typeof creds>(encrypted);

    expect(decrypted).toEqual(creds);
  });

  it("masks secrets for safe UI rendering", () => {
    expect(maskSecret("pass123456")).toBe("pass••••••••3456");
    expect(maskSecret("key-live-99887766554433221100")).toBe("key-••••••••1100");
  });
});
