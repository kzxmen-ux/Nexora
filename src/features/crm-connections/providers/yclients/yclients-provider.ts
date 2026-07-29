import "server-only";

import type {
  BookingProvider,
  BookingProviderConnectionMetadata,
  BookingProviderCredentialValidation,
} from "../booking-provider";

export class YClientsProvider implements BookingProvider {
  disconnect(): { status: "disconnected" } {
    return { status: "disconnected" };
  }

  async getConnectionMetadata(): Promise<BookingProviderConnectionMetadata> {
    return {
      companyId: null,
      configurationMode: "encrypted_credentials",
      credentialsSaved: false,
      credentialsUpdatedAt: null,
      provider: "yclients",
      providerLabel: "YCLIENTS",
      settingsDescription:
        "The YCLIENTS marketplace identifies the salon. API activation is a separate future step.",
    };
  }

  testConnection(input: {
    credentialsSaved: boolean;
  }): { status: "api_access_required" } {
    void input;
    return { status: "api_access_required" };
  }

  validateCredentials(input: unknown): BookingProviderCredentialValidation {
    void input;
    return { data: {}, success: true };
  }
}
