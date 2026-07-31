import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";

import {
  handleAltegioWebhook,
  type AltegioWebhookDependencies,
} from "./handler.ts";
import {
  ALTEGIO_WEBHOOK_MAX_BYTES,
  type AltegioWebhookPayload,
} from "./validation.ts";

const validPayload: AltegioWebhookPayload = {
  company_id: 123456,
  data: { id: 101, name: "Sensitive customer value" },
  resource: "staff",
  resource_id: 101,
  status: "create",
};

function requestWithBody(
  body: string,
  headers: Record<string, string> = {},
): Request {
  return new Request("https://nexora.example/api/webhooks/altegio", {
    body,
    headers: { "content-type": "application/json", ...headers },
    method: "POST",
  });
}

function dependencies(
  storeEvent: AltegioWebhookDependencies["storeEvent"],
): AltegioWebhookDependencies {
  return { storeEvent };
}

async function responseBody(response: Response) {
  return (await response.json()) as Record<string, unknown>;
}

const originalConsoleError = console.error;
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

afterEach(() => {
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
});

describe("Altegio webhook handler", () => {
  test("stores a valid event and acknowledges it", async () => {
    let storedPayload: AltegioWebhookPayload | undefined;
    const response = await handleAltegioWebhook(
      requestWithBody(JSON.stringify(validPayload)),
      dependencies(async (payload) => {
        storedPayload = payload;
        return {
          eventId: "019f9478-905a-7ad6-854c-aa1aa9fd0859",
          outcome: "accepted",
        };
      }),
    );

    assert.equal(response.status, 200);
    assert.deepEqual(await responseBody(response), {
      duplicate: false,
      ok: true,
    });
    assert.deepEqual(storedPayload, validPayload);
  });

  test("rejects malformed JSON and oversized bodies", async () => {
    for (const [body, expectedStatus] of [
      ['{"company_id":', 400],
      ["x".repeat(ALTEGIO_WEBHOOK_MAX_BYTES + 1), 413],
    ] as const) {
      const response = await handleAltegioWebhook(
        requestWithBody(body),
        dependencies(async () => {
          throw new Error("must not run");
        }),
      );

      assert.equal(response.status, expectedStatus);
    }
  });

  test("rejects invalid IDs and bounded strings", async () => {
    for (const invalidPayload of [
      { ...validPayload, company_id: 0 },
      { ...validPayload, resource_id: -1 },
      { ...validPayload, resource: "A".repeat(65) },
      { ...validPayload, status: "invalid status" },
    ]) {
      const response = await handleAltegioWebhook(
        requestWithBody(JSON.stringify(invalidPayload)),
        dependencies(async () => {
          throw new Error("must not run");
        }),
      );

      assert.equal(response.status, 400);
    }
  });

  test("handles unavailable connections and duplicate payloads", async () => {
    const unavailable = await handleAltegioWebhook(
      requestWithBody(JSON.stringify(validPayload)),
      dependencies(async () => ({
        eventId: null,
        outcome: "connection_unavailable",
      })),
    );
    const duplicate = await handleAltegioWebhook(
      requestWithBody(JSON.stringify(validPayload)),
      dependencies(async () => ({
        eventId: "019f9478-905a-7ad6-854c-aa1aa9fd0859",
        outcome: "duplicate",
      })),
    );

    assert.equal(unavailable.status, 404);
    assert.equal(duplicate.status, 200);
    assert.deepEqual(await responseBody(duplicate), {
      duplicate: true,
      ok: true,
    });
  });

  test("returns safe errors and never logs payload data", async () => {
    const loggedValues: unknown[] = [];
    console.error = (...values: unknown[]) => loggedValues.push(...values);
    console.log = (...values: unknown[]) => loggedValues.push(...values);
    console.warn = (...values: unknown[]) => loggedValues.push(...values);

    const response = await handleAltegioWebhook(
      requestWithBody(JSON.stringify(validPayload)),
      dependencies(async () => {
        throw new Error("Sensitive customer value");
      }),
    );
    const serializedResponse = JSON.stringify(await responseBody(response));

    assert.equal(response.status, 503);
    assert.deepEqual(loggedValues, []);
    assert.equal(serializedResponse.includes("Sensitive customer value"), false);
  });
});
