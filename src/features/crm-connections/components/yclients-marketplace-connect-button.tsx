"use client";

import { useActionState } from "react";

import { useLocale } from "@/components/i18n/locale-provider";
import { startYclientsMarketplaceConnectionAction } from "@/features/crm-connections/actions/yclients-marketplace";

import type { CrmConnectionActionState } from "../types";

const initialState: CrmConnectionActionState = { status: "idle" };

type YclientsMarketplaceConnectButtonProps = {
  organizationId: string;
};

export function YclientsMarketplaceConnectButton({
  organizationId,
}: YclientsMarketplaceConnectButtonProps) {
  const { t } = useLocale();
  const [state, action, pending] = useActionState(
    startYclientsMarketplaceConnectionAction,
    initialState,
  );

  return (
    <form action={action} className="mt-7">
      <input name="organizationId" type="hidden" value={organizationId} />
      <button
        className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-70 sm:w-auto"
        disabled={pending}
        type="submit"
      >
        {pending ? t("Redirecting to YCLIENTS…") : t("Connect YCLIENTS")}
      </button>
      {state.status === "error" && state.message ? (
        <p
          className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800"
          role="alert"
        >
          {t(state.message)}
        </p>
      ) : null}
    </form>
  );
}
