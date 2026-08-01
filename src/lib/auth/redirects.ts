import { getCanonicalAltegioCallbackPath } from "@/features/crm-connections/providers/altegio/callback-validation";

const ALLOWED_AUTH_REDIRECTS = new Set([
  "/app",
  "/auth/sign-in",
  "/auth/update-password",
]);

const INVITATION_ACCEPTANCE_PATH = "/invitations/accept";
const INVITATION_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const REDIRECT_VALIDATION_ORIGIN = "https://orqelio.local";

function getSafeInvitationRedirect(value: string): string | null {
  try {
    const url = new URL(value, REDIRECT_VALIDATION_ORIGIN);
    const token = url.searchParams.get("token");

    if (
      url.origin !== REDIRECT_VALIDATION_ORIGIN ||
      url.pathname !== INVITATION_ACCEPTANCE_PATH ||
      url.hash ||
      url.searchParams.size !== 1 ||
      !token ||
      !INVITATION_TOKEN_PATTERN.test(token)
    ) {
      return null;
    }

    return `${INVITATION_ACCEPTANCE_PATH}?token=${encodeURIComponent(token)}`;
  } catch {
    return null;
  }
}

function getSafeAltegioCallbackRedirect(value: string): string | null {
  try {
    const url = new URL(value, REDIRECT_VALIDATION_ORIGIN);

    if (
      url.origin !== REDIRECT_VALIDATION_ORIGIN ||
      url.pathname !== "/integrations/altegio/callback" ||
      url.hash
    ) {
      return null;
    }

    return getCanonicalAltegioCallbackPath({
      salonId: url.searchParams.getAll("salon_id"),
      salonIds: url.searchParams.getAll("salon_ids[]"),
    });
  } catch {
    return null;
  }
}

export function getSafeRedirectPath(
  value: unknown,
  fallback: string,
): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return fallback;
  }

  if (ALLOWED_AUTH_REDIRECTS.has(value)) {
    return value;
  }

  return (
    getSafeInvitationRedirect(value) ??
    getSafeAltegioCallbackRedirect(value) ??
    fallback
  );
}
