"use server";

import { redirect } from "next/navigation";

import { getSafeRedirectPath } from "@/lib/auth/redirects";
import {
  clearPasswordRecoveryMarker,
  hasPasswordRecoveryMarker,
} from "@/lib/auth/recovery";
import {
  type AuthActionState,
  validateCredentials,
  validateEmail,
  validatePasswordConfirmation,
} from "@/lib/auth/validation";
import { getPublicEnvironment } from "@/lib/env/public";
import { createClient } from "@/lib/supabase/server";

const PASSWORD_RESET_REQUEST_MESSAGE =
  "If an account exists and email delivery is available, a password reset link is on its way. If you requested one recently, wait a few minutes before trying again.";

function createCallbackUrl(nextPath: string): string {
  const { appUrl } = getPublicEnvironment();
  const callbackUrl = new URL("/auth/callback", appUrl);
  callbackUrl.searchParams.set(
    "next",
    getSafeRedirectPath(nextPath, "/app"),
  );
  return callbackUrl.toString();
}

function serviceError(message: string): AuthActionState {
  return { message, status: "error" };
}

export async function signInAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const validation = validateCredentials(formData);

  if (!validation.success) {
    return validation.state;
  }

  const supabase = await createClient();
  let authResult: Awaited<
    ReturnType<typeof supabase.auth.signInWithPassword>
  >;

  try {
    authResult = await supabase.auth.signInWithPassword(validation.data);
  } catch {
    return serviceError("Sign in is temporarily unavailable. Try again.");
  }

  if (authResult.error) {
    if (authResult.error.code === "invalid_credentials") {
      return serviceError("Email or password is incorrect.");
    }

    return serviceError("Unable to sign in. Try again.");
  }

  redirect(getSafeRedirectPath(formData.get("next"), "/app"));
}

export async function signUpAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const credentials = validateCredentials(formData);
  const passwordConfirmation = validatePasswordConfirmation(formData);

  if (!credentials.success || !passwordConfirmation.success) {
    const credentialErrors = credentials.success
      ? {}
      : credentials.state.fieldErrors;
    const passwordErrors = passwordConfirmation.success
      ? {}
      : passwordConfirmation.state.fieldErrors;

    return {
      fieldErrors: { ...credentialErrors, ...passwordErrors },
      message: "Check the highlighted fields.",
      status: "error",
    };
  }

  const nextPath = getSafeRedirectPath(formData.get("next"), "/app");
  const supabase = await createClient();
  let authResult: Awaited<ReturnType<typeof supabase.auth.signUp>>;

  try {
    authResult = await supabase.auth.signUp({
      email: credentials.data.email,
      password: credentials.data.password,
      options: {
        emailRedirectTo: createCallbackUrl(nextPath),
      },
    });
  } catch {
    return serviceError("Account creation is temporarily unavailable.");
  }

  if (authResult.error) {
    return serviceError(
      "Unable to create the account. Check your details or try again later.",
    );
  }

  if (authResult.data.session) {
    redirect(nextPath);
  }

  return {
    message:
      "Check your email to confirm your address and finish creating your account.",
    status: "success",
  };
}

export async function requestPasswordResetAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const validation = validateEmail(formData);

  if (!validation.success) {
    return validation.state;
  }

  const supabase = await createClient();

  try {
    await supabase.auth.resetPasswordForEmail(validation.data.email, {
      redirectTo: createCallbackUrl("/auth/update-password"),
    });
  } catch {
    // The response remains generic so account existence is never disclosed.
  }

  return {
    message: PASSWORD_RESET_REQUEST_MESSAGE,
    status: "success",
  };
}

export async function updatePasswordAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const validation = validatePasswordConfirmation(formData);

  if (!validation.success) {
    return validation.state;
  }

  const hasRecoveryMarker = await hasPasswordRecoveryMarker();

  if (!hasRecoveryMarker) {
    return serviceError(
      "This recovery session is invalid or expired. Request a new reset link.",
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    return serviceError(
      "This recovery session is invalid or expired. Request a new reset link.",
    );
  }

  let updateResult: Awaited<ReturnType<typeof supabase.auth.updateUser>>;

  try {
    updateResult = await supabase.auth.updateUser({
      password: validation.data.password,
    });
  } catch {
    return serviceError("Password update is temporarily unavailable.");
  }

  if (updateResult.error) {
    return serviceError(
      "Unable to update the password. Request a new reset link and try again.",
    );
  }

  await clearPasswordRecoveryMarker();
  redirect("/app?password=updated");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    redirect("/app?signout=failed");
  }

  redirect("/auth/sign-in");
}
