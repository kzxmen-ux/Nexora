import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  ALTEGIO_MARKETPLACE_ORGANIZATION_COOKIE,
  ALTEGIO_MARKETPLACE_ORGANIZATION_TTL_SECONDS,
  ALTEGIO_MARKETPLACE_URL,
  createAltegioMarketplaceState,
  hashAltegioMarketplaceState,
  parseAltegioMarketplaceCookie,
  serializeAltegioMarketplaceCookie,
} from "./altegio.ts";

describe("Altegio Marketplace configuration", () => {
  test("uses the Orqelio marketplace entrypoint", () => {
    assert.equal(
      ALTEGIO_MARKETPLACE_URL,
      "https://app.alteg.io/e/mp_2167_orqelio_ai/",
    );
  });

  test("keeps selected organization context short-lived", () => {
    assert.equal(
      ALTEGIO_MARKETPLACE_ORGANIZATION_COOKIE,
      "orqelio_altegio_organization",
    );
    assert.equal(ALTEGIO_MARKETPLACE_ORGANIZATION_TTL_SECONDS, 3300);
  });

  test("round-trips opaque server-controlled attempt state", () => {
    const state = createAltegioMarketplaceState();
    const value = {
      attemptId: "33333333-3333-4333-8333-333333333333",
      organizationId: "22222222-2222-4222-8222-222222222222",
      state,
    };
    assert.deepEqual(parseAltegioMarketplaceCookie(serializeAltegioMarketplaceCookie(value)), value);
    assert.match(hashAltegioMarketplaceState(state), /^[0-9a-f]{64}$/);
  });
});
