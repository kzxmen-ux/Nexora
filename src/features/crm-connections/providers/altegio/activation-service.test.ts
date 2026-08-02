import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { processAltegioActivation } from "./activation-service.ts";
import type { AltegioActivationClaim, AltegioActivationLocation, AltegioActivationRepository } from "./activation-types.ts";
import type { AltegioMarketplaceTransport } from "./marketplace-transport.ts";

const organizationId = "22222222-2222-4222-8222-222222222222";

function harness(ids: string[], options: { activateFails?: string[]; claim?: AltegioActivationClaim; verifyFails?: string[] } = {}) {
  const locations: AltegioActivationLocation[] = ids.map((locationId) => ({ activationSucceeded: false, errorCode: null, lastStage: null, locationId, status: "pending" }));
  const activationCalls: string[] = [];
  const verificationCalls: string[] = [];
  const repository: AltegioActivationRepository = {
    async beginRetry() { return options.claim ?? { claimStatus: "accepted", shouldProcess: true }; },
    async claim() { return options.claim ?? { claimStatus: "accepted", shouldProcess: true }; },
    async finalize() {
      const verified = locations.filter((item) => item.status === "verified").length;
      const activationStatus = verified === locations.length ? "succeeded" : verified > 0 ? "partial" : "error";
      return { activationStatus, connectionId: "33333333-3333-4333-8333-333333333333", organizationId };
    },
    async getState() {
      const verifiedLocationIds = locations.filter((item) => item.status === "verified").map((item) => item.locationId);
      const failedLocationIds = locations.filter((item) => item.status === "failed").map((item) => item.locationId);
      return { canRetry: failedLocationIds.length > 0, connectionId: "33333333-3333-4333-8333-333333333333", failedLocationIds, locationIds: ids, organizationId, state: verifiedLocationIds.length === ids.length ? "succeeded" : verifiedLocationIds.length ? "partial" : "error", verifiedLocationIds };
    },
    async listLocations() { return locations; },
    async recordResult(result) {
      const location = locations.find((item) => item.locationId === result.locationId);
      if (!location) return false;
      if (result.result === "activated") { location.activationSucceeded = true; location.status = "activated"; location.lastStage = "activation"; }
      else if (result.result === "verified") { location.status = "verified"; location.lastStage = "verification"; }
      else { location.status = "failed"; location.lastStage = result.result === "activation_failed" ? "activation" : "verification"; location.errorCode = result.errorCode ?? null; }
      return true;
    },
  };
  const client = {
    async activateLocation(id: string) { activationCalls.push(id); return options.activateFails?.includes(id) ? { code: "provider_unavailable" as const, retryable: true, success: false as const } : { success: true as const }; },
    async verifyLocationAccess(id: string) { verificationCalls.push(id); return options.verifyFails?.includes(id) ? { code: "forbidden" as const, retryable: false, success: false as const } : { success: true as const }; },
  } as AltegioMarketplaceTransport;
  return { activationCalls, client, locations, repository, verificationCalls };
}

async function run(ids: string[], setup = harness(ids)) {
  const result = await processAltegioActivation({ locationIds: ids, mode: "callback", organizationId }, { applicationId: 2167, client: setup.client, repository: setup.repository });
  return { ...setup, result };
}

describe("Altegio activation workflow", () => {
  test("activates and verifies one or multiple locations", async () => {
    assert.equal((await run(["1"])).result.state, "succeeded");
    const multiple = await run(["1", "2"]);
    assert.equal(multiple.result.state, "succeeded");
    assert.deepEqual(multiple.activationCalls, ["1", "2"]);
  });

  test("reports expired, reused, and user or organization mismatch safely", async () => {
    for (const claimStatus of ["expired", "reused", "unavailable"] as const) {
      const result = await run(["1"], harness(["1"], { claim: { claimStatus, shouldProcess: false } }));
      assert.equal(result.result.state, claimStatus);
      assert.deepEqual(result.activationCalls, []);
    }
  });

  test("does not issue provider calls for duplicate callback delivery", async () => {
    const result = await run(["1"], harness(["1"], { claim: { claimStatus: "reused", shouldProcess: false } }));
    assert.equal(result.activationCalls.length, 0);
  });

  test("records partial multi-location activation without claiming connected", async () => {
    const result = await run(["1", "2"], harness(["1", "2"], { activateFails: ["2"] }));
    assert.equal(result.result.state, "partial");
    assert.deepEqual(result.result.verifiedLocationIds, ["1"]);
  });

  test("does not connect when activation succeeds but access verification fails", async () => {
    const result = await run(["1"], harness(["1"], { verifyFails: ["1"] }));
    assert.equal(result.result.state, "error");
    assert.deepEqual(result.verificationCalls, ["1"]);
  });

  test("retry skips a location whose provider activation already succeeded", async () => {
    const setup = harness(["1"]);
    setup.locations[0].activationSucceeded = true;
    setup.locations[0].status = "failed";
    setup.locations[0].lastStage = "verification";
    setup.locations[0].errorCode = "forbidden";
    const result = await processAltegioActivation({ mode: "retry", organizationId }, { applicationId: 2167, client: setup.client, repository: setup.repository });
    assert.equal(result.state, "succeeded");
    assert.deepEqual(setup.activationCalls, []);
    assert.deepEqual(setup.verificationCalls, ["1"]);
  });
});
