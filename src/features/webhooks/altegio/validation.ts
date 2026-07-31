import { WEBHOOK_MAX_BYTES } from "../shared/handler.ts";
import {
  type ProviderWebhookPayload,
  providerWebhookPayloadSchema,
} from "../shared/validation.ts";

export const ALTEGIO_WEBHOOK_MAX_BYTES = WEBHOOK_MAX_BYTES;
export const altegioWebhookPayloadSchema = providerWebhookPayloadSchema;
export type AltegioWebhookPayload = ProviderWebhookPayload;
