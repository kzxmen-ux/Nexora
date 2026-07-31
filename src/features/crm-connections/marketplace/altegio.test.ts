import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  ALTEGIO_MARKETPLACE_ORGANIZATION_COOKIE,
  ALTEGIO_MARKETPLACE_ORGANIZATION_TTL_SECONDS,
  ALTEGIO_MARKETPLACE_URL,
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
    assert.equal(ALTEGIO_MARKETPLACE_ORGANIZATION_TTL_SECONDS, 3600);
  });
});
