import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { ALTEGIO_ACCEPT_HEADER, ALTEGIO_MARKETPLACE_ACTIVATION_URL, createAltegioMarketplaceTransport } from "./marketplace-transport.ts";

const options = { applicationId: 2167, partnerToken: "fake-partner", userToken: "fake-user" };

describe("Altegio Marketplace transport", () => {
  test("uses the documented activation URL, headers, and body", async () => {
    let request: { init?: RequestInit; url?: string } = {};
    const transport = createAltegioMarketplaceTransport({ ...options, fetchImplementation: async (url, init) => { request = { init, url: String(url) }; return new Response(null, { status: 201 }); } });
    assert.deepEqual(await transport.activateLocation("42"), { success: true });
    assert.equal(request.url, ALTEGIO_MARKETPLACE_ACTIVATION_URL);
    assert.equal(request.init?.method, "POST");
    assert.deepEqual(JSON.parse(String(request.init?.body)), { application_id: 2167, salon_id: 42 });
    assert.deepEqual(request.init?.headers, { Accept: ALTEGIO_ACCEPT_HEADER, Authorization: "Bearer fake-partner", "Content-Type": "application/json" });
  });

  test("maps documented provider errors without exposing bodies", async () => {
    const expected = new Map([[401, "unauthorized"], [403, "forbidden"], [404, "not_found"], [422, "validation_error"]]);
    for (const [status, code] of expected) {
      const transport = createAltegioMarketplaceTransport({ ...options, fetchImplementation: async () => new Response("provider secret detail", { status }) });
      assert.equal((await transport.activateLocation("42") as { code: string }).code, code);
    }
  });

  test("times out safely", async () => {
    const transport = createAltegioMarketplaceTransport({ ...options, timeoutMs: 1, fetchImplementation: async (_url, init) => await new Promise((_resolve, reject) => init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")))) });
    assert.deepEqual(await transport.activateLocation("42"), { code: "timeout", retryable: true, success: false });
  });

  test("verifies access with both server tokens and rejects mismatched data", async () => {
    let authorization = "";
    const success = createAltegioMarketplaceTransport({ ...options, fetchImplementation: async (_url, init) => { authorization = (init?.headers as Record<string, string>).Authorization; return Response.json({ success: true, data: { id: 42 } }); } });
    assert.deepEqual(await success.verifyLocationAccess("42"), { success: true });
    assert.equal(authorization, "Bearer fake-partner, User fake-user");
    const mismatch = createAltegioMarketplaceTransport({ ...options, fetchImplementation: async () => Response.json({ success: true, data: { id: 99 } }) });
    assert.equal((await mismatch.verifyLocationAccess("42") as { code: string }).code, "invalid_response");
  });
});
