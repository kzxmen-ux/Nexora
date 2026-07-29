import { getYclientsMarketplaceState } from "../queries/crm-connections";
import type { CrmConnection } from "../types";
import { YclientsMarketplaceConnectButton } from "./yclients-marketplace-connect-button";
import { getTranslator } from "@/lib/i18n/server";

type YclientsMarketplaceConnectionPanelProps = {
  callbackFailed?: boolean;
  connection: CrmConnection;
  organizationId: string;
};

export async function YclientsMarketplaceConnectionPanel({
  callbackFailed = false,
  connection,
  organizationId,
}: YclientsMarketplaceConnectionPanelProps) {
  const [marketplaceState, t] = await Promise.all([
    getYclientsMarketplaceState(organizationId, connection.id),
    getTranslator(),
  ]);
  const failed =
    callbackFailed ||
    !marketplaceState ||
    marketplaceState.status === "failed";

  if (marketplaceState?.status === "activation_required") {
    return (
      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-7">
        <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800">
          {t("Activation required")}
        </span>
        <h3 className="mt-4 text-xl font-semibold text-slate-950">
          {t("YCLIENTS callback received")}
        </h3>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          {t(
            "The salon was confirmed by the marketplace redirect. Nexora has not activated API access yet.",
          )}
        </p>
        <dl className="mt-5 rounded-2xl border border-amber-200 bg-white px-5 py-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t("Salon ID")}
          </dt>
          <dd className="mt-1 font-mono text-sm font-semibold text-slate-950">
            {marketplaceState.salonId}
          </dd>
        </dl>
      </section>
    );
  }

  if (marketplaceState?.status === "waiting" && !callbackFailed) {
    return (
      <section className="rounded-3xl border border-indigo-200 bg-indigo-50 p-7">
        <span className="inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-800">
          {t("Waiting for confirmation")}
        </span>
        <h3 className="mt-4 text-xl font-semibold text-slate-950">
          {t("Connection is waiting for confirmation")}
        </h3>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          {t(
            "Complete the marketplace step in YCLIENTS. This request expires after 10 minutes.",
          )}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
      {failed ? (
        <p
          className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800"
          role="alert"
        >
          {t(
            "The YCLIENTS callback could not be completed. The request may be missing, expired, reused, or invalid.",
          )}
        </p>
      ) : null}
      <h3 className={failed ? "mt-6 text-xl font-semibold" : "text-xl font-semibold"}>
        {t("Connect YCLIENTS")}
      </h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        {t(
          "You will be redirected to the official YCLIENTS marketplace. No API token is requested on this page.",
        )}
      </p>
      <YclientsMarketplaceConnectButton organizationId={organizationId} />
    </section>
  );
}
