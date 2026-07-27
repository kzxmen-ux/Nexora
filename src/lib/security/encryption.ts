import "server-only";

import { createCipheriv, randomBytes } from "node:crypto";

import { getYclientsCredentialsEncryptionKey } from "@/lib/env/server";

const ALGORITHM = "aes-256-gcm";
const INITIALIZATION_VECTOR_BYTES = 12;
const KEY_VERSION = 1;

export type EncryptedCredentialEnvelope = {
  authenticationTag: string;
  encryptedPayload: string;
  initializationVector: string;
  keyVersion: number;
};

export function encryptCredentialPayload(
  credentials: Readonly<Record<string, string>>,
): EncryptedCredentialEnvelope {
  const initializationVector = randomBytes(INITIALIZATION_VECTOR_BYTES);
  const cipher = createCipheriv(
    ALGORITHM,
    getYclientsCredentialsEncryptionKey(),
    initializationVector,
    { authTagLength: 16 },
  );
  const plaintext = Buffer.from(JSON.stringify(credentials), "utf8");
  const encryptedPayload = Buffer.concat([
    cipher.update(plaintext),
    cipher.final(),
  ]);

  plaintext.fill(0);

  return {
    authenticationTag: cipher.getAuthTag().toString("base64"),
    encryptedPayload: encryptedPayload.toString("base64"),
    initializationVector: initializationVector.toString("base64"),
    keyVersion: KEY_VERSION,
  };
}
