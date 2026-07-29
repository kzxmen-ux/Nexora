import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";

import {
  handleYclientsWebhook,
  type YclientsWebhookDependencies,
} from "./handler.ts";
import {
  YCLIENTS_WEBHOOK_MAX_BYTES,
  type YclientsWebhookPayload,
} from "./validation.ts";

const validPayload: YclientsWebhookPayload = {
  company_id: 997441,
  data: {
    id: 5058870,
    name: "Sensitive customer value",
    phone: "+70000000000",
  },
  resource: "staff",
  resource_id: 5058870,
  status: "create",
};

function requestWithBody(
  body: string,
  headers: Record<string, string> = {},
): Request {
  return new Request("https://nexora.example/api/webhooks/yclients", {
    body,
    headers: {
      "content-type": "application/json",
      ...headers,
    },
    method: "POST",
  });
}

function dependencies(
  storeEvent: YclientsWebhookDependencies["storeEvent"],
): YclientsWebhookDependencies {
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

describe("YCLIENTS webhook handler", () => {
  test("durably stores a valid event and returns 200", async () => {
    let storedPayload: YclientsWebhookPayload | undefined;
    const response = await handleYclientsWebhook(
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

  test("rejects malformed JSON without calling storage", async () => {
    let storageCalled = false;
    const response = await handleYclientsWebhook(
      requestWithBody('{"company_id":'),
      dependencies(async () => {
        storageCalled = true;
        throw new Error("must not run");
      }),
    );

    assert.equal(response.status, 400);
    assert.equal(storageCalled, false);
    assert.deepEqual(await responseBody(response), {
      error: "invalid_payload",
      ok: false,
    });
  });

  test("accepts application/json requests only", async () => {
    const response = await handleYclientsWebhook(
      requestWithBody(JSON.stringify(validPayload), {
        "content-type": "text/plain",
      }),
      dependencies(async () => {
        throw new Error("must not run");
      }),
    );

    assert.equal(response.status, 415);
    assert.deepEqual(await responseBody(response), {
      error: "unsupported_media_type",
      ok: false,
    });
  });

  test("rejects an oversized streamed body", async () => {
    const response = await handleYclientsWebhook(
      requestWithBody("x".repeat(YCLIENTS_WEBHOOK_MAX_BYTES + 1)),
      dependencies(async () => {
        throw new Error("must not run");
      }),
    );

    assert.equal(response.status, 413);
    assert.deepEqual(await responseBody(response), {
      error: "payload_too_large",
      ok: false,
    });
  });

  test("rejects invalid company and resource IDs", async () => {
    for (const invalidPayload of [
      { ...validPayload, company_id: 0 },
      { ...validPayload, resource_id: -1 },
      { ...validPayload, resource_id: 1.5 },
    ]) {
      const response = await handleYclientsWebhook(
        requestWithBody(JSON.stringify(invalidPayload)),
        dependencies(async () => {
          throw new Error("must not run");
        }),
      );

      assert.equal(response.status, 400);
      assert.deepEqual(await responseBody(response), {
        error: "invalid_payload",
        ok: false,
      });
    }
  });

  test("rejects an unknown or disconnected company safely", async () => {
    const response = await handleYclientsWebhook(
      requestWithBody(JSON.stringify(validPayload)),
      dependencies(async () => ({
        eventId: null,
        outcome: "connection_unavailable",
      })),
    );

    assert.equal(response.status, 404);
    assert.deepEqual(await responseBody(response), {
      error: "connection_unavailable",
      ok: false,
    });
  });

  test("acknowledges a duplicate payload without creating work", async () => {
    const response = await handleYclientsWebhook(
      requestWithBody(JSON.stringify(validPayload)),
      dependencies(async () => ({
        eventId: "019f9478-905a-7ad6-854c-aa1aa9fd0859",
        outcome: "duplicate",
      })),
    );

    assert.equal(response.status, 200);
    assert.deepEqual(await responseBody(response), {
      duplicate: true,
      ok: true,
    });
  });

  test("returns a safe 503 when database storage fails", async () => {
    const response = await handleYclientsWebhook(
      requestWithBody(JSON.stringify(validPayload)),
      dependencies(async () => {
        throw new Error(
          `database rejected ${validPayload.data.phone as string}`,
        );
      }),
    );
    const serializedResponse = JSON.stringify(await responseBody(response));

    assert.equal(response.status, 503);
    assert.equal(serializedResponse.includes("+70000000000"), false);
    assert.equal(serializedResponse.includes("database rejected"), false);
  });

  test("does not expose payload data through logs or responses", async () => {
    const loggedValues: unknown[] = [];
    console.error = (...values: unknown[]) => loggedValues.push(...values);
    console.log = (...values: unknown[]) => loggedValues.push(...values);
    console.warn = (...values: unknown[]) => loggedValues.push(...values);

    const response = await handleYclientsWebhook(
      requestWithBody(JSON.stringify(validPayload)),
      dependencies(async () => ({
        eventId: "019f9478-905a-7ad6-854c-aa1aa9fd0859",
        outcome: "accepted",
      })),
    );
    const serializedResponse = JSON.stringify(await responseBody(response));

    assert.deepEqual(loggedValues, []);
    assert.equal(serializedResponse.includes("Sensitive customer value"), false);
    assert.equal(serializedResponse.includes("+70000000000"), false);
  });
});
