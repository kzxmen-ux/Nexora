import type {
  AltegioMarketplaceTransport,
  AltegioProviderErrorCode,
} from "./marketplace-transport";

export type AltegioActivationLocation = {
  activationSucceeded: boolean;
  errorCode: string | null;
  lastStage: "activation" | "verification" | null;
  locationId: string;
  status: "activated" | "failed" | "pending" | "verified";
};

export type AltegioActivationState =
  | "error"
  | "expired"
  | "in_progress"
  | "mismatch"
  | "partial"
  | "reused"
  | "succeeded"
  | "unavailable";

export type AltegioActivationResult = {
  canRetry: boolean;
  connectionId: string | null;
  failedLocationIds: string[];
  locationIds: string[];
  organizationId: string;
  state: AltegioActivationState;
  verifiedLocationIds: string[];
};

export type AltegioActivationClaim = {
  claimStatus:
    | "accepted"
    | "expired"
    | "mismatch"
    | "reused"
    | "unavailable";
  shouldProcess: boolean;
};

export type AltegioActivationFinalization = {
  activationStatus: "error" | "partial" | "succeeded";
  connectionId: string;
  organizationId: string;
};

export interface AltegioActivationRepository {
  beginRetry(): Promise<AltegioActivationClaim | null>;
  claim(locationIds: string[]): Promise<AltegioActivationClaim | null>;
  finalize(applicationId: number): Promise<AltegioActivationFinalization | null>;
  getState(): Promise<AltegioActivationResult | null>;
  listLocations(): Promise<AltegioActivationLocation[] | null>;
  recordResult(input: {
    errorCode?: AltegioProviderErrorCode;
    locationId: string;
    result:
      | "activated"
      | "activation_failed"
      | "verification_failed"
      | "verified";
  }): Promise<boolean>;
}

export type AltegioActivationDependencies = {
  applicationId: number;
  client: AltegioMarketplaceTransport;
  repository: AltegioActivationRepository;
};
