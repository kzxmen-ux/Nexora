import { createHash, randomBytes } from "node:crypto";

import { z } from "zod";

export const ALTEGIO_MARKETPLACE_ORGANIZATION_COOKIE =
  "orqelio_altegio_organization";
export const ALTEGIO_MARKETPLACE_ORGANIZATION_TTL_SECONDS = 55 * 60;
export const ALTEGIO_MARKETPLACE_URL =
  "https://app.alteg.io/e/mp_2167_orqelio_ai/";

const altegioMarketplaceCookieSchema = z.object({
  attemptId: z.uuid(),
  organizationId: z.uuid(),
  state: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
});

export type AltegioMarketplaceCookie = z.infer<
  typeof altegioMarketplaceCookieSchema
>;

export function createAltegioMarketplaceState(): string {
  return randomBytes(32).toString("base64url");
}

export function hashAltegioMarketplaceState(state: string): string {
  return createHash("sha256").update(state, "utf8").digest("hex");
}

export function serializeAltegioMarketplaceCookie(
  value: AltegioMarketplaceCookie,
): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

export function parseAltegioMarketplaceCookie(
  value: string | undefined,
): AltegioMarketplaceCookie | null {
  if (!value) {
    return null;
  }

  try {
    const decoded: unknown = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    );
    const parsed = altegioMarketplaceCookieSchema.safeParse(decoded);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
