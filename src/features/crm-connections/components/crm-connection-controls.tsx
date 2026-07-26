"use client";

import { useActionState } from "react";

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
  return state.message ? (
    <p
      className={
        state.status === "success"
          ? "mt-3 text-sm text-emerald-700"
          : "mt-3 text-sm text-rose-700"
      }
      role={state.status === "success" ? "status" : "alert"}
    >
      {state.message}
    </p>
  ) : null;
}

export function CrmConnectionControls({
  connectionId,
  organizationId,
  status,
}: CrmConnectionControlsProps) {
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
          Connection lifecycle
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          No real CRM adapter exists yet. Nexora will not mark this placeholder
          as connected without a verified provider response.
        </p>

        <button
          className="mt-5 cursor-not-allowed rounded-xl bg-slate-200 px-4 py-3 text-sm font-semibold text-slate-500"
          disabled
          type="button"
        >
          Connect provider — not available yet
        </button>

        {status === "disconnected" || status === "error" ? (
          <form action={draftAction} className="mt-4">
            {hiddenFields}
            <button
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
              disabled={draftPending}
              type="submit"
            >
              {draftPending ? "Updating…" : "Return to draft"}
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
              {disconnectPending ? "Updating…" : "Mark as disconnected"}
            </button>
            <ActionMessage state={disconnectState} />
          </form>
        )}
      </section>

      <section className="rounded-3xl border border-rose-200 bg-rose-50 p-7">
        <h2 className="text-xl font-semibold text-rose-950">
          Delete connection
        </h2>
        <p className="mt-3 text-sm leading-6 text-rose-800">
          This removes only this Nexora connection record. It does not modify
          any external CRM.
        </p>
        <form action={deleteAction} className="mt-5">
          {hiddenFields}
          <button
            className="rounded-xl bg-rose-700 px-4 py-3 text-sm font-semibold text-white hover:bg-rose-800 disabled:opacity-60"
            disabled={deletePending}
            type="submit"
          >
            {deletePending ? "Deleting…" : "Delete connection"}
          </button>
          <ActionMessage state={deleteState} />
        </form>
      </section>
    </div>
  );
}
