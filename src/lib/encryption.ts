import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const DEFAULT_KEY_HEX = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

function getMasterKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_MASTER_KEY || DEFAULT_KEY_HEX;
  if (keyHex.length !== 64) {
    // If not a 64-character hex string (32 bytes), hash it to guarantee 32 bytes
    return crypto.createHash("sha256").update(keyHex).digest();
  }
  return Buffer.from(keyHex, "hex");
}

export interface EncryptedData {
  encryptedPayload: string;
  iv: string;
  authTag: string;
}

/**
 * Encrypts arbitrary plain text or JSON object using AES-256-GCM.
 */
export function encryptSecret(plainText: string | object): EncryptedData {
  const text = typeof plainText === "object" ? JSON.stringify(plainText) : plainText;
  const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
  const key = getMasterKey();

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return {
    encryptedPayload: encrypted,
    iv: iv.toString("hex"),
    authTag: authTag,
  };
}

/**
 * Decrypts AES-256-GCM payload back to original string or parsed JSON.
 */
export function decryptSecret<T = any>(encryptedData: {
  encryptedPayload: string;
  iv: string;
  authTag: string;
}): T {
  const key = getMasterKey();
  const iv = Buffer.from(encryptedData.iv, "hex");
  const authTag = Buffer.from(encryptedData.authTag, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedData.encryptedPayload, "hex", "utf8");
  decrypted += decipher.final("utf8");

  try {
    return JSON.parse(decrypted) as T;
  } catch {
    return decrypted as unknown as T;
  }
}

/**
 * Masks a sensitive token or password for safe UI rendering.
 */
export function maskSecret(secret: string): string {
  if (!secret || secret.length <= 4) return "••••••••";
  if (secret.length <= 8) return secret.slice(0, 2) + "••••" + secret.slice(-2);
  return secret.slice(0, 4) + "••••••••" + secret.slice(-4);
}
