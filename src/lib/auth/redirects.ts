const ALLOWED_AUTH_REDIRECTS = new Set([
  "/app",
  "/auth/sign-in",
  "/auth/update-password",
]);

export function getSafeRedirectPath(
  value: unknown,
  fallback: string,
): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    !ALLOWED_AUTH_REDIRECTS.has(value)
  ) {
    return fallback;
  }

  return value;
}
