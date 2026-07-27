import "server-only";

import type {
  BookingProvider,
  BookingProviderConnectionMetadata,
  BookingProviderCredentialValidation,
} from "../booking-provider";

export class DevelopmentProvider implements BookingProvider {
  disconnect(): { status: "disconnected" } {
    return { status: "disconnected" };
  }

  async getConnectionMetadata(): Promise<BookingProviderConnectionMetadata> {
    return {
      companyId: null,
      configurationMode: "non_secret",
      credentialsSaved: false,
      credentialsUpdatedAt: null,
      provider: "custom",
      providerLabel: "Development connection",
      settingsDescription:
        "Only controlled, non-secret placeholder configuration is stored.",
    };
  }

  testConnection(): { status: "provider_unavailable" } {
    return { status: "provider_unavailable" };
  }

  validateCredentials(): BookingProviderCredentialValidation {
    return { data: {}, success: true };
  }
}
