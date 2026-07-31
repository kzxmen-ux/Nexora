"use client";

import { useActionState } from "react";

import { useLocale } from "@/components/i18n/locale-provider";
import { startAltegioMarketplaceConnectionAction } from "@/features/crm-connections/actions/altegio-marketplace";

import type { CrmConnectionActionState } from "../types";

const initialState: CrmConnectionActionState = { status: "idle" };

type AltegioMarketplaceConnectButtonProps = {
  organizationId: string;
};

export function AltegioMarketplaceConnectButton({
  organizationId,
}: AltegioMarketplaceConnectButtonProps) {
  const { t } = useLocale();
  const [state, action, pending] = useActionState(
    startAltegioMarketplaceConnectionAction,
    initialState,
  );

  return (
    <form action={action} className="mt-6">
      <input name="organizationId" type="hidden" value={organizationId} />
      <button
        className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-70"
        disabled={pending}
        type="submit"
      >
        {pending ? t("Redirecting to Altegio…") : t("Connect Altegio")}
      </button>
      {state.status === "error" && state.message ? (
        <p
          className="mt-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800"
          role="alert"
        >
          {t(state.message)}
        </p>
      ) : null}
    </form>
  );
}
