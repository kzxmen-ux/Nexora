import { z } from "zod";

const positiveSafeIntegerSchema = z.number().int().positive().safe();

const resourceSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z][a-z0-9_]{0,63}$/);

const eventStatusSchema = z
  .string()
  .min(1)
  .max(32)
  .regex(/^[a-z][a-z0-9_-]{0,31}$/);

export const providerWebhookPayloadSchema = z
  .object({
    company_id: positiveSafeIntegerSchema,
    data: z.record(z.string(), z.unknown()),
    resource: resourceSchema,
    resource_id: positiveSafeIntegerSchema,
    status: eventStatusSchema,
  })
  .strict();

export type ProviderWebhookPayload = z.infer<
  typeof providerWebhookPayloadSchema
>;
