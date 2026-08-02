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

  async getConnectionMetadata(connection: import("../../types").CrmConnection): Promise<BookingProviderConnectionMetadata> {
    const verifiedLocations = connection.configuration.verifiedLocationIds ?? [];
    return {
      companyId: verifiedLocations[0] ?? null,
      configurationMode: "non_secret",
      credentialsSaved: false,
      credentialsUpdatedAt: null,
      provider: "altegio",
      providerLabel: "Altegio",
      settingsDescription:
        connection.configuration.providerActivationStatus === "verified"
          ? "Altegio locations were activated and API access was verified."
          : "Altegio activation is incomplete or requires attention.",
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
