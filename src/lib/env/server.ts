import "server-only";

const ENCRYPTION_KEY_BYTES = 32;

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
