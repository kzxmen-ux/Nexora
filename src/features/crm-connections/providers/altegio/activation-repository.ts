import "server-only";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

import type {
  AltegioActivationClaim,
  AltegioActivationLocation,
  AltegioActivationRepository,
  AltegioActivationResult,
} from "./activation-types";

const claimRowsSchema = z.array(
  z.object({
    claim_status: z.enum([
      "accepted",
      "expired",
      "mismatch",
      "reused",
      "unavailable",
    ]),
    should_process: z.boolean(),
  }),
);

const databaseIdSchema = z.union([z.number().int().positive(), z.string()]);
const locationRowsSchema = z.array(
  z.object({
    activation_status: z.enum(["activated", "failed", "pending", "verified"]),
    activation_succeeded: z.boolean(),
    error_code: z.string().nullable(),
    last_stage: z.enum(["activation", "verification"]).nullable(),
    location_id: databaseIdSchema,
  }),
);
const finalizationRowsSchema = z.array(
  z.object({
    activation_status: z.enum(["error", "partial", "succeeded"]),
    connection_id: z.uuid(),
    organization_id: z.uuid(),
  }),
);
const stateRowsSchema = z.array(
  z.object({
    activation_status: z.enum([
      "error",
      "expired",
      "partial",
      "pending",
      "processing",
      "succeeded",
    ]),
    connection_id: z.uuid().nullable(),
    expires_at: z.string(),
    failed_location_ids: z.array(databaseIdSchema).nullable(),
    selected_location_ids: z.array(databaseIdSchema).nullable(),
    verified_location_ids: z.array(databaseIdSchema).nullable(),
  }),
);

type AltegioActivationRepositoryInput = {
  attemptId: string;
  organizationId: string;
  stateHash: string;
};

function singleClaim(value: unknown): AltegioActivationClaim | null {
  const parsed = claimRowsSchema.safeParse(value);

  if (!parsed.success || parsed.data.length !== 1) {
    return null;
  }

  return {
    claimStatus: parsed.data[0].claim_status,
    shouldProcess: parsed.data[0].should_process,
  };
}

function ids(values: Array<number | string> | null): string[] {
  return (values ?? []).map(String);
}

export async function createAltegioActivationRepository(
  input: AltegioActivationRepositoryInput,
): Promise<AltegioActivationRepository> {
  const supabase = await createClient();
  const sharedParameters = {
    p_attempt_id: input.attemptId,
    p_organization_id: input.organizationId,
    p_state_hash: input.stateHash,
  };

  return {
    async beginRetry() {
      const { data, error } = await supabase.rpc(
        "begin_altegio_marketplace_retry",
        sharedParameters,
      );
      return error ? null : singleClaim(data);
    },

    async claim(locationIds) {
      const { data, error } = await supabase.rpc(
        "claim_altegio_marketplace_callback",
        {
          ...sharedParameters,
          p_location_ids: locationIds.map(Number),
        },
      );
      return error ? null : singleClaim(data);
    },

    async finalize(applicationId) {
      const { data, error } = await supabase.rpc(
        "finalize_altegio_marketplace_attempt",
        {
          ...sharedParameters,
          p_application_id: applicationId,
        },
      );
      const parsed = finalizationRowsSchema.safeParse(data);

      if (error || !parsed.success || parsed.data.length !== 1) {
        return null;
      }

      const row = parsed.data[0];
      return {
        activationStatus: row.activation_status,
        connectionId: row.connection_id,
        organizationId: row.organization_id,
      };
    },

    async getState(): Promise<AltegioActivationResult | null> {
      const { data, error } = await supabase.rpc(
        "get_altegio_marketplace_attempt_state",
        sharedParameters,
      );
      const parsed = stateRowsSchema.safeParse(data);

      if (error || !parsed.success || parsed.data.length !== 1) {
        return null;
      }

      const row = parsed.data[0];
      const state =
        row.activation_status === "pending" ||
        row.activation_status === "processing"
          ? "in_progress"
          : row.activation_status;

      return {
        canRetry:
          (state === "partial" || state === "error") &&
          new Date(row.expires_at).getTime() > Date.now(),
        connectionId: row.connection_id,
        failedLocationIds: ids(row.failed_location_ids),
        locationIds: ids(row.selected_location_ids),
        organizationId: input.organizationId,
        state,
        verifiedLocationIds: ids(row.verified_location_ids),
      };
    },

    async listLocations(): Promise<AltegioActivationLocation[] | null> {
      const { data, error } = await supabase.rpc(
        "list_altegio_marketplace_locations",
        sharedParameters,
      );
      const parsed = locationRowsSchema.safeParse(data);

      if (error || !parsed.success) {
        return null;
      }

      return parsed.data.map((row) => ({
        activationSucceeded: row.activation_succeeded,
        errorCode: row.error_code,
        lastStage: row.last_stage,
        locationId: String(row.location_id),
        status: row.activation_status,
      }));
    },

    async recordResult(result) {
      const { error } = await supabase.rpc(
        "record_altegio_marketplace_location_result",
        {
          ...sharedParameters,
          p_error_code: result.errorCode ?? null,
          p_location_id: Number(result.locationId),
          p_result: result.result,
        },
      );
      return !error;
    },
  };
}
