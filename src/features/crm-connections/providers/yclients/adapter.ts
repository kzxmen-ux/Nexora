import "server-only";

import { z } from "zod";

import type { CrmConnection } from "../../types";

const secretTokenSchema = z
  .string()
  .min(8, "Enter the complete token.")
  .max(4096, "The token is too long.");

export const yclientsCredentialsSchema = z.object({
  partnerToken: secretTokenSchema,
  userToken: secretTokenSchema,
});

export type YclientsCredentials = z.infer<typeof yclientsCredentialsSchema>;

export type YclientsConnectionMetadata = {
  companyId: string | null;
  credentialsSaved: boolean;
  credentialsUpdatedAt: string | null;
  provider: "yclients";
};

export type YclientsConnectionTestResult =
  | {
      status: "credentials_required";
    }
  | {
      status: "api_access_required";
    };

export const yclientsAdapter = {
  disconnect(): { status: "disconnected" } {
    return { status: "disconnected" };
  },

  getConnectionMetadata(
    connection: CrmConnection,
    credentialStatus: {
      credentialsSaved: boolean;
      credentialsUpdatedAt: string | null;
    },
  ): YclientsConnectionMetadata {
    return {
      companyId: connection.configuration.companyId ?? null,
      credentialsSaved: credentialStatus.credentialsSaved,
      credentialsUpdatedAt: credentialStatus.credentialsUpdatedAt,
      provider: "yclients",
    };
  },

  testConnection(input: {
    credentialsSaved: boolean;
  }): YclientsConnectionTestResult {
    return input.credentialsSaved
      ? { status: "api_access_required" }
      : { status: "credentials_required" };
  },

  validateCredentials(input: unknown) {
    return yclientsCredentialsSchema.safeParse(input);
  },
};
