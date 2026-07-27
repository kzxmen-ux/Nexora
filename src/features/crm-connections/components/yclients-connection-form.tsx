"use client";

import { useActionState } from "react";

import { useLocale } from "@/components/i18n/locale-provider";

import {
  createYclientsConnectionAction,
  updateYclientsConnectionAction,
} from "../actions/crm-connections";
import type {
  CrmConnection,
  CrmConnectionActionState,
} from "../types";

const INITIAL_STATE: CrmConnectionActionState = { status: "idle" };

type YclientsConnectionFormProps =
  | {
      connection?: never;
      mode: "create";
      organizationId: string;
    }
  | {
      connection: CrmConnection;
      mode: "update";
      organizationId: string;
    };

export function YclientsConnectionForm(
  props: YclientsConnectionFormProps,
) {
  const { t } = useLocale();
  const action =
    props.mode === "create"
      ? createYclientsConnectionAction
      : updateYclientsConnectionAction;
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);
  const connection = props.mode === "update" ? props.connection : null;

  return (
    <form action={formAction} className="mt-7 space-y-5">
      <input
        name="organizationId"
        type="hidden"
        value={props.organizationId}
      />
      {connection ? (
        <input name="connectionId" type="hidden" value={connection.id} />
      ) : null}

      <div>
        <label
          className="text-sm font-medium text-slate-800"
          htmlFor="displayName"
        >
          {t("Connection name")}
        </label>
        <input
          aria-describedby="display-name-error"
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          defaultValue={connection?.displayName ?? "YCLIENTS"}
          id="displayName"
          maxLength={100}
          name="displayName"
          required
        />
        {state.fieldErrors?.displayName ? (
          <p className="mt-2 text-sm text-rose-700" id="display-name-error">
            {t(state.fieldErrors.displayName[0])}
          </p>
        ) : null}
      </div>

      <div>
        <label
          className="text-sm font-medium text-slate-800"
          htmlFor="companyId"
        >
          {t("YCLIENTS company ID")}
        </label>
        <input
          aria-describedby="company-id-help company-id-error"
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          defaultValue={connection?.configuration.companyId}
          id="companyId"
          inputMode="numeric"
          maxLength={32}
          name="companyId"
          pattern="[0-9]+"
          required
        />
        <p className="mt-2 text-xs leading-5 text-slate-500" id="company-id-help">
          {t(
            "This is the non-secret branch identifier from your YCLIENTS account.",
          )}
        </p>
        {state.fieldErrors?.companyId ? (
          <p className="mt-2 text-sm text-rose-700" id="company-id-error">
            {t(state.fieldErrors.companyId[0])}
          </p>
        ) : null}
      </div>

      {state.message ? (
        <p
          className={
            state.status === "success"
              ? "rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
              : "rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700"
          }
          role={state.status === "success" ? "status" : "alert"}
        >
          {t(state.message)}
        </p>
      ) : null}

      <button
        className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending
          ? t("Saving…")
          : props.mode === "create"
            ? t("Create YCLIENTS connection")
            : t("Save connection settings")}
      </button>
    </form>
  );
}
