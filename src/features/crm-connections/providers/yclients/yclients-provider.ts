import "server-only";

import { z } from "zod";

import { getCrmConnectionCredentialStatus } from "../../queries/crm-connections";
import type { CrmConnection } from "../../types";
import type {
  BookingProvider,
  BookingProviderConnectionMetadata,
  BookingProviderCredentialValidation,
  BookingProviderMetadataOptions,
} from "../booking-provider";

const secretTokenSchema = z
  .string()
  .min(8, "Enter the complete token.")
  .max(4096, "The token is too long.");

const yclientsCredentialsSchema = z.object({
  partnerToken: secretTokenSchema,
  userToken: secretTokenSchema,
});

export class YClientsProvider implements BookingProvider {
  disconnect(): { status: "disconnected" } {
    return { status: "disconnected" };
  }

  async getConnectionMetadata(
    connection: CrmConnection,
    options: BookingProviderMetadataOptions = {},
  ): Promise<BookingProviderConnectionMetadata | null> {
    const credentialStatus = options.includeCredentialStatus
      ? await getCrmConnectionCredentialStatus(
          connection.organizationId,
          connection.id,
        )
      : {
          credentialsSaved: false,
          credentialsUpdatedAt: null,
        };

    if (!credentialStatus) {
      return null;
    }

    return {
      companyId: connection.configuration.companyId ?? null,
      configurationMode: "encrypted_credentials",
      credentialsSaved: credentialStatus.credentialsSaved,
      credentialsUpdatedAt: credentialStatus.credentialsUpdatedAt,
      provider: "yclients",
      providerLabel: "YCLIENTS",
      settingsDescription:
        "Only the non-secret company ID is stored with the connection. Tokens are stored separately in encrypted form.",
    };
  }

  testConnection(input: {
    credentialsSaved: boolean;
  }): { status: "api_access_required" | "credentials_required" } {
    return input.credentialsSaved
      ? { status: "api_access_required" }
      : { status: "credentials_required" };
  }

  validateCredentials(input: unknown): BookingProviderCredentialValidation {
    const validation = yclientsCredentialsSchema.safeParse(input);

    return validation.success
      ? { data: validation.data, success: true }
      : {
          fieldErrors: validation.error.flatten().fieldErrors,
          success: false,
        };
  }
}
