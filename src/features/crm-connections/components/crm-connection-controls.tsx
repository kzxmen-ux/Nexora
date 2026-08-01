"use client";

import { useActionState } from "react";

import { useLocale } from "@/components/i18n/locale-provider";

import {
  deleteCrmConnectionAction,
  disconnectCrmConnectionAction,
  returnCrmConnectionToDraftAction,
} from "../actions/crm-connections";
import type {
  CrmConnectionActionState,
  CrmConnectionStatus,
} from "../types";

const INITIAL_STATE: CrmConnectionActionState = { status: "idle" };

type CrmConnectionControlsProps = {
  connectionId: string;
  organizationId: string;
  status: CrmConnectionStatus;
};

function ActionMessage({ state }: { state: CrmConnectionActionState }) {
  const { t } = useLocale();

  return state.message ? (
    <p
      className={
        state.status === "success"
          ? "mt-3 text-sm text-emerald-700"
          : "mt-3 text-sm text-rose-700"
      }
      role={state.status === "success" ? "status" : "alert"}
    >
      {t(state.message)}
    </p>
  ) : null;
}

export function CrmConnectionControls({
  connectionId,
  organizationId,
  status,
}: CrmConnectionControlsProps) {
  const { t } = useLocale();
  const [disconnectState, disconnectAction, disconnectPending] =
    useActionState(disconnectCrmConnectionAction, INITIAL_STATE);
  const [draftState, draftAction, draftPending] = useActionState(
    returnCrmConnectionToDraftAction,
    INITIAL_STATE,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteCrmConnectionAction,
    INITIAL_STATE,
  );

  const hiddenFields = (
    <>
      <input name="connectionId" type="hidden" value={connectionId} />
      <input name="organizationId" type="hidden" value={organizationId} />
    </>
  );

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-950">
          {t("Connection lifecycle")}
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {t(
            "No real CRM adapter exists yet. Orqelio will not mark this placeholder as connected without a verified provider response.",
          )}
        </p>

        <button
          className="mt-5 cursor-not-allowed rounded-xl bg-slate-200 px-4 py-3 text-sm font-semibold text-slate-500"
          disabled
          type="button"
        >
          {t("Connect provider — not available yet")}
        </button>

        {status === "disconnected" || status === "error" ? (
          <form action={draftAction} className="mt-4">
            {hiddenFields}
            <button
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
              disabled={draftPending}
              type="submit"
            >
              {draftPending ? t("Updating…") : t("Return to draft")}
            </button>
            <ActionMessage state={draftState} />
          </form>
        ) : (
          <form action={disconnectAction} className="mt-4">
            {hiddenFields}
            <button
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
              disabled={disconnectPending}
              type="submit"
            >
              {disconnectPending
                ? t("Updating…")
                : t("Mark as disconnected")}
            </button>
            <ActionMessage state={disconnectState} />
          </form>
        )}
      </section>

      <section className="rounded-3xl border border-rose-200 bg-rose-50 p-7">
        <h2 className="text-xl font-semibold text-rose-950">
          {t("Delete connection")}
        </h2>
        <p className="mt-3 text-sm leading-6 text-rose-800">
          {t(
            "This removes only this Orqelio connection record. It does not modify any external CRM.",
          )}
        </p>
        <form action={deleteAction} className="mt-5">
          {hiddenFields}
          <button
            className="rounded-xl bg-rose-700 px-4 py-3 text-sm font-semibold text-white hover:bg-rose-800 disabled:opacity-60"
            disabled={deletePending}
            type="submit"
          >
            {deletePending ? t("Deleting…") : t("Delete connection")}
          </button>
          <ActionMessage state={deleteState} />
        </form>
      </section>
    </div>
  );
}
