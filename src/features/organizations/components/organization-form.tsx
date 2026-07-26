"use client";

import { useActionState } from "react";

import { useLocale } from "@/components/i18n/locale-provider";

import {
  createOrganizationAction,
  updateOrganizationAction,
} from "../actions/organizations";
import type { Organization, OrganizationActionState } from "../types";

const INITIAL_STATE: OrganizationActionState = { status: "idle" };

type OrganizationFormProps =
  | {
      mode: "create";
      organization?: never;
    }
  | {
      mode: "update";
      organization: Organization;
    };

export function OrganizationForm({
  mode,
  organization,
}: OrganizationFormProps) {
  const { t } = useLocale();
  const action =
    mode === "create" ? createOrganizationAction : updateOrganizationAction;
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);

  return (
    <form action={formAction} className="mt-6 space-y-5">
      {mode === "update" ? (
        <input
          name="organizationId"
          type="hidden"
          value={organization.id}
        />
      ) : null}

      <div>
        <label
          className="text-sm font-medium text-slate-800"
          htmlFor={`${mode}-organization-name`}
        >
          {t("Organization name")}
        </label>
        <input
          aria-describedby={`${mode}-organization-name-error`}
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          defaultValue={organization?.name}
          id={`${mode}-organization-name`}
          maxLength={100}
          name="name"
          required
        />
        {state.fieldErrors?.name ? (
          <p
            className="mt-2 text-sm text-rose-700"
            id={`${mode}-organization-name-error`}
          >
            {t(state.fieldErrors.name[0])}
          </p>
        ) : null}
      </div>

      <div>
        <label
          className="text-sm font-medium text-slate-800"
          htmlFor={`${mode}-organization-slug`}
        >
          {t("Slug")}
        </label>
        <input
          aria-describedby={`${mode}-organization-slug-error`}
          autoCapitalize="none"
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          defaultValue={organization?.slug}
          id={`${mode}-organization-slug`}
          maxLength={63}
          minLength={3}
          name="slug"
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          required
        />
        {state.fieldErrors?.slug ? (
          <p
            className="mt-2 text-sm text-rose-700"
            id={`${mode}-organization-slug-error`}
          >
            {t(state.fieldErrors.slug[0])}
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
        className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending
          ? t("Saving…")
          : mode === "create"
            ? t("Create organization")
            : t("Save settings")}
      </button>
    </form>
  );
}
