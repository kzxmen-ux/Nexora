import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { z } from "zod";

export const YCLIENTS_MARKETPLACE_URL =
  "https://yclients.com/e/mp_47949_nexora_ai/";
export const YCLIENTS_MARKETPLACE_COOKIE =
  "nexora_yclients_marketplace";
export const YCLIENTS_MARKETPLACE_TTL_SECONDS = 10 * 60;

const marketplaceCookieSchema = z.object({
  attemptId: z.uuid(),
  connectionId: z.uuid(),
  organizationId: z.uuid(),
  state: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
});

export type YclientsMarketplaceCookie = z.infer<
  typeof marketplaceCookieSchema
>;

export function createMarketplaceState(): string {
  return randomBytes(32).toString("base64url");
}

export function hashMarketplaceState(state: string): string {
  return createHash("sha256").update(state, "utf8").digest("hex");
}

export function serializeMarketplaceCookie(
  value: YclientsMarketplaceCookie,
): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

export function parseMarketplaceCookie(
  value: string | undefined,
): YclientsMarketplaceCookie | null {
  if (!value) {
    return null;
  }

  try {
    const decoded: unknown = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    );
    const parsed = marketplaceCookieSchema.safeParse(decoded);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
