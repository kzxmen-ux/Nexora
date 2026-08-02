import type {
  AltegioActivationDependencies,
  AltegioActivationResult,
} from "./activation-types";

type ProcessAltegioActivationInput = {
  locationIds?: string[];
  mode: "callback" | "retry";
  organizationId: string;
};

function claimFailure(
  organizationId: string,
  claimStatus: "expired" | "mismatch" | "reused" | "unavailable",
): AltegioActivationResult {
  return {
    canRetry: false,
    connectionId: null,
    failedLocationIds: [],
    locationIds: [],
    organizationId,
    state: claimStatus,
    verifiedLocationIds: [],
  };
}

export async function processAltegioActivation(
  input: ProcessAltegioActivationInput,
  dependencies: AltegioActivationDependencies,
): Promise<AltegioActivationResult> {
  const claim =
    input.mode === "callback"
      ? await dependencies.repository.claim(input.locationIds ?? [])
      : await dependencies.repository.beginRetry();

  if (!claim) {
    return claimFailure(input.organizationId, "unavailable");
  }

  if (!claim.shouldProcess) {
    return claimFailure(
      input.organizationId,
      claim.claimStatus === "accepted" ? "unavailable" : claim.claimStatus,
    );
  }

  const locations = await dependencies.repository.listLocations();

  if (!locations) {
    return claimFailure(input.organizationId, "unavailable");
  }

  for (const location of locations) {
    if (location.status === "verified") {
      continue;
    }

    let activationSucceeded = location.activationSucceeded;

    if (!activationSucceeded) {
      const activation = await dependencies.client.activateLocation(
        location.locationId,
      );

      if (!activation.success) {
        await dependencies.repository.recordResult({
          errorCode: activation.code,
          locationId: location.locationId,
          result: "activation_failed",
        });
        continue;
      }

      activationSucceeded = await dependencies.repository.recordResult({
        locationId: location.locationId,
        result: "activated",
      });

      if (!activationSucceeded) {
        return claimFailure(input.organizationId, "unavailable");
      }
    }

    const verification = await dependencies.client.verifyLocationAccess(
      location.locationId,
    );

    await dependencies.repository.recordResult(
      verification.success
        ? { locationId: location.locationId, result: "verified" }
        : {
            errorCode: verification.code,
            locationId: location.locationId,
            result: "verification_failed",
          },
    );
  }

  const finalized = await dependencies.repository.finalize(
    dependencies.applicationId,
  );

  if (!finalized) {
    return claimFailure(input.organizationId, "unavailable");
  }

  const state = await dependencies.repository.getState();

  if (!state) {
    return {
      canRetry: finalized.activationStatus !== "succeeded",
      connectionId: finalized.connectionId,
      failedLocationIds: [],
      locationIds: input.locationIds ?? [],
      organizationId: finalized.organizationId,
      state: finalized.activationStatus,
      verifiedLocationIds: [],
    };
  }

  return state;
}
