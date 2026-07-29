import "server-only";

const ENCRYPTION_KEY_BYTES = 32;

export function getSupabaseSecretKey(): string {
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();

  if (!secretKey?.startsWith("sb_secret_")) {
    throw new Error("Server-only Supabase access is not configured.");
  }

  return secretKey;
}

export function getYclientsCredentialsEncryptionKey(): Buffer {
  const encodedKey = process.env.YCLIENTS_CREDENTIALS_ENCRYPTION_KEY;

  if (!encodedKey) {
    throw new Error("YCLIENTS credential encryption is not configured.");
  }

  const key = Buffer.from(encodedKey, "base64");

  if (
    key.length !== ENCRYPTION_KEY_BYTES ||
    key.toString("base64") !== encodedKey
  ) {
    throw new Error("YCLIENTS credential encryption is not configured.");
  }

  return key;
}
