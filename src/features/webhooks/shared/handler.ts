export const WEBHOOK_MAX_BYTES = 256 * 1024;

export type WebhookStoreResult =
  | {
      eventId: string;
      outcome: "accepted" | "duplicate";
    }
  | {
      eventId: null;
      outcome: "connection_unavailable";
    };

type SafeParser<TPayload> = {
  safeParse(input: unknown):
    | { data: TPayload; success: true }
    | { success: false };
};

export type WebhookDependencies<TPayload> = {
  payloadSchema: SafeParser<TPayload>;
  storeEvent(payload: TPayload): Promise<WebhookStoreResult>;
};

type BodyReadResult =
  | { status: "invalid" }
  | { status: "ok"; value: string }
  | { status: "oversized" };

function jsonResponse(
  body: Readonly<Record<string, boolean | string>>,
  status: number,
): Response {
  return Response.json(body, {
    headers: { "Cache-Control": "no-store" },
    status,
  });
}

function isJsonContentType(request: Request): boolean {
  const contentType = request.headers.get("content-type");

  return Boolean(
    contentType &&
      contentType.split(";", 1)[0]?.trim().toLowerCase() ===
        "application/json",
  );
}

function declaredBodyIsOversized(request: Request): boolean {
  const contentLength = request.headers.get("content-length");

  if (!contentLength) {
    return false;
  }

  const parsedLength = Number(contentLength);
  return (
    !Number.isSafeInteger(parsedLength) ||
    parsedLength < 0 ||
    parsedLength > WEBHOOK_MAX_BYTES
  );
}

async function readBoundedBody(request: Request): Promise<BodyReadResult> {
  if (declaredBodyIsOversized(request)) {
    return { status: "oversized" };
  }

  if (!request.body) {
    return { status: "invalid" };
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    totalBytes += value.byteLength;

    if (totalBytes > WEBHOOK_MAX_BYTES) {
      await reader.cancel();
      return { status: "oversized" };
    }

    chunks.push(value);
  }

  if (totalBytes === 0) {
    return { status: "invalid" };
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;

  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return {
      status: "ok",
      value: new TextDecoder("utf-8", { fatal: true }).decode(body),
    };
  } catch {
    return { status: "invalid" };
  }
}

export async function handleJsonWebhook<TPayload>(
  request: Request,
  dependencies: WebhookDependencies<TPayload>,
): Promise<Response> {
  if (!isJsonContentType(request)) {
    return jsonResponse(
      { error: "unsupported_media_type", ok: false },
      415,
    );
  }

  let body: BodyReadResult;

  try {
    body = await readBoundedBody(request);
  } catch {
    return jsonResponse({ error: "invalid_payload", ok: false }, 400);
  }

  if (body.status === "oversized") {
    return jsonResponse({ error: "payload_too_large", ok: false }, 413);
  }

  if (body.status === "invalid") {
    return jsonResponse({ error: "invalid_payload", ok: false }, 400);
  }

  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(body.value) as unknown;
  } catch {
    return jsonResponse({ error: "invalid_payload", ok: false }, 400);
  }

  const payload = dependencies.payloadSchema.safeParse(parsedJson);

  if (!payload.success) {
    return jsonResponse({ error: "invalid_payload", ok: false }, 400);
  }

  try {
    const result = await dependencies.storeEvent(payload.data);

    if (result.outcome === "connection_unavailable") {
      return jsonResponse(
        { error: "connection_unavailable", ok: false },
        404,
      );
    }

    return jsonResponse(
      { duplicate: result.outcome === "duplicate", ok: true },
      200,
    );
  } catch {
    return jsonResponse(
      { error: "webhook_temporarily_unavailable", ok: false },
      503,
    );
  }
}
