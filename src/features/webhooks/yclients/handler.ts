import {
  handleJsonWebhook,
  type WebhookDependencies,
  type WebhookStoreResult,
} from "../shared/handler.ts";
import {
  type YclientsWebhookPayload,
  yclientsWebhookPayloadSchema,
} from "./validation.ts";

export type YclientsWebhookStoreResult = WebhookStoreResult;

export type YclientsWebhookDependencies = Omit<
  WebhookDependencies<YclientsWebhookPayload>,
  "payloadSchema"
>;

export function handleYclientsWebhook(
  request: Request,
  dependencies: YclientsWebhookDependencies,
): Promise<Response> {
  return handleJsonWebhook(request, {
    ...dependencies,
    payloadSchema: yclientsWebhookPayloadSchema,
  });
}
