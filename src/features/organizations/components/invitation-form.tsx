"use client";

import { useActionState, useState } from "react";

import { useLocale } from "@/components/i18n/locale-provider";

import { createInvitationAction } from "../actions/invitations";
import type { InvitationActionState } from "../invitations/types";

const INITIAL_STATE: InvitationActionState = { status: "idle" };

function CopyInvitationLink({ link }: { link: string }) {
  const { t } = useLocale();
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
      <label
        className="text-sm font-medium text-emerald-950"
        htmlFor="invitation-link"
      >
        {t("One-time invitation link")}
      </label>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <input
          className="min-w-0 flex-1 rounded-xl border border-emerald-300 bg-white px-3 py-2 text-sm text-slate-700"
          id="invitation-link"
          readOnly
          value={link}
        />
        <button
          className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
          onClick={copyLink}
          type="button"
        >
          {copied ? t("Copied") : t("Copy link")}
        </button>
      </div>
    </div>
  );
}

export function InvitationForm({
  organizationId,
}: {
  organizationId: string;
}) {
  const { t } = useLocale();
  const [state, formAction, pending] = useActionState(
    createInvitationAction,
    INITIAL_STATE,
  );

  return (
    <form action={formAction} className="mt-6">
      <input name="organizationId" type="hidden" value={organizationId} />

      <label className="text-sm font-medium text-slate-800" htmlFor="admin-email">
        {t("Administrator email")}
      </label>
      <input
        aria-describedby="admin-email-error"
        autoComplete="email"
        className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        id="admin-email"
        maxLength={254}
        name="email"
        placeholder="admin@example.com"
        required
        type="email"
      />

      {state.fieldErrors?.email ? (
        <p className="mt-2 text-sm text-rose-700" id="admin-email-error">
          {t(state.fieldErrors.email[0])}
        </p>
      ) : null}

      {state.message ? (
        <p
          className={
            state.status === "success"
              ? "mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
              : "mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700"
          }
          role={state.status === "success" ? "status" : "alert"}
        >
          {t(state.message)}
        </p>
      ) : null}

      {state.invitationLink ? (
        <CopyInvitationLink link={state.invitationLink} />
      ) : null}

      <button
        className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? t("Creating…") : t("Create invitation")}
      </button>
    </form>
  );
}
