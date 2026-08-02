import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  getCanonicalAltegioCallbackPath,
  validateAltegioCallbackIds,
} from "./callback-validation.ts";

describe("Altegio callback validation", () => {
  test("accepts one salon_id", () => {
    assert.deepEqual(validateAltegioCallbackIds({ salonId: "123" }), {
      locationIds: ["123"],
      success: true,
    });
  });

  test("accepts repeated salon_ids[] and removes duplicates", () => {
    assert.deepEqual(
      validateAltegioCallbackIds({ salonIds: ["123", "456", "123"] }),
      { locationIds: ["123", "456"], success: true },
    );
  });

  test("rejects missing, mixed, non-positive, and out-of-range IDs", () => {
    for (const input of [
      {},
      { salonId: "0" },
      { salonId: "1", salonIds: "2" },
      { salonIds: ["1", "invalid"] },
      { salonId: "9223372036854775808" },
      { salonId: "9007199254740992" },
    ]) {
      assert.deepEqual(validateAltegioCallbackIds(input), {
        success: false,
      });
    }
  });

  test("builds a canonical safe callback path", () => {
    assert.equal(
      getCanonicalAltegioCallbackPath({ salonIds: ["123", "456"] }),
      "/integrations/altegio/callback?salon_ids%5B%5D=123&salon_ids%5B%5D=456",
    );
  });
});
