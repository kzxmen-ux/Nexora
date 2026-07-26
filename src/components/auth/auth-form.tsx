"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  requestPasswordResetAction,
  signInAction,
  signUpAction,
  updatePasswordAction,
} from "@/features/auth/actions";
import {
  type AuthActionState,
  INITIAL_AUTH_ACTION_STATE,
} from "@/lib/auth/validation";
import { useLocale } from "@/components/i18n/locale-provider";

type AuthFormVariant =
  | "forgot-password"
  | "sign-in"
  | "sign-up"
  | "update-password";

type AuthFormProps = {
  initialMessage?: AuthActionState;
  nextPath?: string;
  variant: AuthFormVariant;
};

const ACTIONS = {
  "forgot-password": requestPasswordResetAction,
  "sign-in": signInAction,
  "sign-up": signUpAction,
  "update-password": updatePasswordAction,
} satisfies Record<AuthFormVariant, typeof signInAction>;

const SUBMIT_LABELS: Record<AuthFormVariant, string> = {
  "forgot-password": "Send reset link",
  "sign-in": "Sign in",
  "sign-up": "Create account",
  "update-password": "Update password",
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  const { t } = useLocale();

  return (
    <button
      className="mt-2 inline-flex h-12 w-full items-center justify-center rounded-xl bg-indigo-600 px-5 font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending ? t("Please wait…") : label}
    </button>
  );
}

function FieldError({
  id,
  message,
}: {
  id: string;
  message: string | undefined;
}) {
  const { t } = useLocale();

  return message ? (
    <p className="mt-1.5 text-sm text-rose-600" id={id}>
      {t(message)}
    </p>
  ) : null;
}

export function AuthForm({
  initialMessage,
  nextPath,
  variant,
}: AuthFormProps) {
  const { t } = useLocale();
  const [state, formAction] = useActionState(
    ACTIONS[variant],
    initialMessage ?? INITIAL_AUTH_ACTION_STATE,
  );
  const showsEmail = variant !== "update-password";
  const showsPassword =
    variant === "sign-in" ||
    variant === "sign-up" ||
    variant === "update-password";
  const showsPasswordConfirmation =
    variant === "sign-up" || variant === "update-password";
  const passwordAutocomplete =
    variant === "sign-in" ? "current-password" : "new-password";

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {nextPath ? <input name="next" type="hidden" value={nextPath} /> : null}

      {showsEmail ? (
        <div>
          <label
            className="text-sm font-medium text-slate-800"
            htmlFor={`${variant}-email`}
          >
            {t("Email")}
          </label>
          <input
            aria-describedby={
              state.fieldErrors?.email ? `${variant}-email-error` : undefined
            }
            aria-invalid={Boolean(state.fieldErrors?.email)}
            autoComplete="email"
            className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            id={`${variant}-email`}
            inputMode="email"
            name="email"
            placeholder="you@example.com"
            required
            type="email"
          />
          <FieldError
            id={`${variant}-email-error`}
            message={state.fieldErrors?.email}
          />
        </div>
      ) : null}

      {showsPassword ? (
        <div>
          <label
            className="text-sm font-medium text-slate-800"
            htmlFor={`${variant}-password`}
          >
            {variant === "update-password" ? t("New password") : t("Password")}
          </label>
          <input
            aria-describedby={
              state.fieldErrors?.password
                ? `${variant}-password-error`
                : undefined
            }
            aria-invalid={Boolean(state.fieldErrors?.password)}
            autoComplete={passwordAutocomplete}
            className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            id={`${variant}-password`}
            maxLength={128}
            minLength={variant === "sign-in" ? undefined : 8}
            name="password"
            required
            type="password"
          />
          <FieldError
            id={`${variant}-password-error`}
            message={state.fieldErrors?.password}
          />
        </div>
      ) : null}

      {showsPasswordConfirmation ? (
        <div>
          <label
            className="text-sm font-medium text-slate-800"
            htmlFor={`${variant}-password-confirmation`}
          >
            {t("Confirm password")}
          </label>
          <input
            aria-describedby={
              state.fieldErrors?.passwordConfirmation
                ? `${variant}-password-confirmation-error`
                : undefined
            }
            aria-invalid={Boolean(state.fieldErrors?.passwordConfirmation)}
            autoComplete="new-password"
            className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            id={`${variant}-password-confirmation`}
            maxLength={128}
            minLength={8}
            name="passwordConfirmation"
            required
            type="password"
          />
          <FieldError
            id={`${variant}-password-confirmation-error`}
            message={state.fieldErrors?.passwordConfirmation}
          />
        </div>
      ) : null}

      {state.message ? (
        <p
          className={
            state.status === "success"
              ? "rounded-xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800"
              : "rounded-xl bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700"
          }
          role={state.status === "error" ? "alert" : "status"}
        >
          {t(state.message)}
        </p>
      ) : null}

      <SubmitButton label={t(SUBMIT_LABELS[variant])} />
    </form>
  );
}
