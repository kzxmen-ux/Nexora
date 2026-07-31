import "server-only";

import type {
  BookingProvider,
  BookingProviderConnectionMetadata,
  BookingProviderCredentialValidation,
} from "../booking-provider";

export class AltegioProvider implements BookingProvider {
  disconnect(): { status: "disconnected" } {
    return { status: "disconnected" };
  }

  async getConnectionMetadata(): Promise<BookingProviderConnectionMetadata> {
    return {
      companyId: null,
      configurationMode: "non_secret",
      credentialsSaved: false,
      credentialsUpdatedAt: null,
      provider: "altegio",
      providerLabel: "Altegio",
      settingsDescription:
        "Altegio activation and API access are not implemented yet.",
    };
  }

  testConnection(): { status: "api_access_required" } {
    return { status: "api_access_required" };
  }

  validateCredentials(input: unknown): BookingProviderCredentialValidation {
    void input;
    return { data: {}, success: true };
  }
}
