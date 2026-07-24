import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

const PASSWORD_RECOVERY_COOKIE = "nexora-password-recovery";
const PASSWORD_RECOVERY_MAX_AGE_SECONDS = 15 * 60;
const PASSWORD_RECOVERY_VALUE = "pending";

const PASSWORD_RECOVERY_COOKIE_OPTIONS = {
  httpOnly: true,
  maxAge: PASSWORD_RECOVERY_MAX_AGE_SECONDS,
  path: "/auth/update-password",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

/**
 * This marker is not an authentication credential. It only records that the
 * current browser reached the password page through the recovery callback.
 * Every protected recovery operation must still validate the user with
 * Supabase Auth on the server.
 */
export function markPasswordRecoveryCallback(response: NextResponse): void {
  response.cookies.set(
    PASSWORD_RECOVERY_COOKIE,
    PASSWORD_RECOVERY_VALUE,
    PASSWORD_RECOVERY_COOKIE_OPTIONS,
  );
}

export async function hasPasswordRecoveryMarker(): Promise<boolean> {
  const cookieStore = await cookies();

  return (
    cookieStore.get(PASSWORD_RECOVERY_COOKIE)?.value ===
    PASSWORD_RECOVERY_VALUE
  );
}

export async function clearPasswordRecoveryMarker(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(PASSWORD_RECOVERY_COOKIE, "", {
    ...PASSWORD_RECOVERY_COOKIE_OPTIONS,
    maxAge: 0,
  });
}
