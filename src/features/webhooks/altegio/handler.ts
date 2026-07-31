import {
  handleJsonWebhook,
  type WebhookDependencies,
  type WebhookStoreResult,
} from "../shared/handler.ts";
import {
  type AltegioWebhookPayload,
  altegioWebhookPayloadSchema,
} from "./validation.ts";

export type AltegioWebhookStoreResult = WebhookStoreResult;

export type AltegioWebhookDependencies = Omit<
  WebhookDependencies<AltegioWebhookPayload>,
  "payloadSchema"
>;

export function handleAltegioWebhook(
  request: Request,
  dependencies: AltegioWebhookDependencies,
): Promise<Response> {
  return handleJsonWebhook(request, {
    ...dependencies,
    payloadSchema: altegioWebhookPayloadSchema,
  });
}
