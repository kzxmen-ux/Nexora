"use client";

import { useActionState } from "react";

import { useLocale } from "@/components/i18n/locale-provider";

import {
  deleteCrmConnectionAction,
  disconnectYclientsConnectionAction,
  saveYclientsCredentialsAction,
  testYclientsConnectionAction,
} from "../actions/crm-connections";
import type { CrmConnectionActionState } from "../types";

const INITIAL_STATE: CrmConnectionActionState = { status: "idle" };

type YclientsCredentialsControlsProps = {
  connectionId: string;
  credentialsSaved: boolean;
  organizationId: string;
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

export function YclientsCredentialsControls({
  connectionId,
  credentialsSaved,
  organizationId,
}: YclientsCredentialsControlsProps) {
  const { t } = useLocale();
  const [saveState, saveAction, savePending] = useActionState(
    saveYclientsCredentialsAction,
    INITIAL_STATE,
  );
  const [testState, testAction, testPending] = useActionState(
    testYclientsConnectionAction,
    INITIAL_STATE,
  );
  const [disconnectState, disconnectAction, disconnectPending] =
    useActionState(disconnectYclientsConnectionAction, INITIAL_STATE);
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-slate-950">
            {t("YCLIENTS credentials")}
          </h2>
          <span
            className={
              credentialsSaved
                ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                : "rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"
            }
          >
            {credentialsSaved
              ? t("Credentials saved")
              : t("Credentials required")}
          </span>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {t(
            "Secrets are encrypted before storage and are never shown again. Saving new values replaces the previous credentials.",
          )}
        </p>

        <form action={saveAction} className="mt-5 space-y-4">
          {hiddenFields}
          <div>
            <label
              className="text-sm font-medium text-slate-800"
              htmlFor="partnerToken"
            >
              {t("Partner API token")}
            </label>
            <input
              autoComplete="new-password"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              id="partnerToken"
              maxLength={4096}
              name="partnerToken"
              required
              type="password"
            />
            {saveState.fieldErrors?.partnerToken ? (
              <p className="mt-2 text-sm text-rose-700">
                {t(saveState.fieldErrors.partnerToken[0])}
              </p>
            ) : null}
          </div>
          <div>
            <label
              className="text-sm font-medium text-slate-800"
              htmlFor="userToken"
            >
              {t("User token")}
            </label>
            <input
              autoComplete="new-password"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              id="userToken"
              maxLength={4096}
              name="userToken"
              required
              type="password"
            />
            {saveState.fieldErrors?.userToken ? (
              <p className="mt-2 text-sm text-rose-700">
                {t(saveState.fieldErrors.userToken[0])}
              </p>
            ) : null}
          </div>
          <button
            className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            disabled={savePending}
            type="submit"
          >
            {savePending
              ? t("Saving…")
              : credentialsSaved
                ? t("Replace credentials")
                : t("Save credentials")}
          </button>
          <ActionMessage state={saveState} />
        </form>

        <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-200 pt-6">
          <form action={testAction}>
            {hiddenFields}
            <button
              className="rounded-xl border border-indigo-300 px-4 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-60"
              disabled={testPending}
              type="submit"
            >
              {testPending ? t("Testing…") : t("Test connection")}
            </button>
            <ActionMessage state={testState} />
          </form>
          <form action={disconnectAction}>
            {hiddenFields}
            <button
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              disabled={disconnectPending}
              type="submit"
            >
              {disconnectPending ? t("Disconnecting…") : t("Disconnect")}
            </button>
            <ActionMessage state={disconnectState} />
          </form>
        </div>
      </section>

      <section className="rounded-3xl border border-rose-200 bg-rose-50 p-7">
        <h2 className="text-xl font-semibold text-rose-950">
          {t("Delete connection")}
        </h2>
        <p className="mt-3 text-sm leading-6 text-rose-800">
          {t(
            "Deleting this connection also permanently deletes its encrypted credentials.",
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
