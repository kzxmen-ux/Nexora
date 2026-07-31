import { WEBHOOK_MAX_BYTES } from "../shared/handler.ts";
import {
  type ProviderWebhookPayload,
  providerWebhookPayloadSchema,
} from "../shared/validation.ts";

export const YCLIENTS_WEBHOOK_MAX_BYTES = WEBHOOK_MAX_BYTES;
export const yclientsWebhookPayloadSchema = providerWebhookPayloadSchema;
export type YclientsWebhookPayload = ProviderWebhookPayload;
