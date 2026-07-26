"use client";

import { useFormStatus } from "react-dom";

import { useLocale } from "@/components/i18n/locale-provider";

export function SignOutButton() {
  const { pending } = useFormStatus();
  const { t } = useLocale();

  return (
    <button
      className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending ? t("Signing out…") : t("Sign out")}
    </button>
  );
}
