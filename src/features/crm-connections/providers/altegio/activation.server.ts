import "server-only";

import { getAltegioServerEnvironment } from "@/lib/env/server";

import { processAltegioActivation } from "./activation-service";
import { createAltegioMarketplaceClient } from "./marketplace-client";
import { createAltegioActivationRepository } from "./activation-repository";
import type { AltegioActivationResult } from "./activation-types";

type RunAltegioActivationInput = {
  attemptId: string;
  locationIds?: string[];
  mode: "callback" | "retry";
  organizationId: string;
  stateHash: string;
};

export async function runAltegioActivation(
  input: RunAltegioActivationInput,
): Promise<AltegioActivationResult> {
  const repository = await createAltegioActivationRepository(input);

  try {
    const environment = getAltegioServerEnvironment();
    return await processAltegioActivation(input, {
      applicationId: environment.applicationId,
      client: createAltegioMarketplaceClient(),
      repository,
    });
  } catch {
    const locations = await repository.listLocations();

    if (locations) {
      for (const location of locations) {
        if (location.status !== "verified") {
          await repository.recordResult({
            errorCode: "configuration_error",
            locationId: location.locationId,
            result: location.activationSucceeded
              ? "verification_failed"
              : "activation_failed",
          });
        }
      }

      await repository.finalize(2167);
    }

    return (
      (await repository.getState()) ?? {
        canRetry: false,
        connectionId: null,
        failedLocationIds: [],
        locationIds: input.locationIds ?? [],
        organizationId: input.organizationId,
        state: "error",
        verifiedLocationIds: [],
      }
    );
  }
}

export async function getAltegioActivationState(
  input: Omit<RunAltegioActivationInput, "mode" | "locationIds">,
): Promise<AltegioActivationResult | null> {
  const repository = await createAltegioActivationRepository(input);
  return repository.getState();
}
