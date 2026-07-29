import { CrmConnectionControls } from "../../components/crm-connection-controls";
import { CrmConnectionForm } from "../../components/crm-connection-form";
import { YclientsMarketplaceConnectionPanel } from "../../components/yclients-marketplace-connection-panel";
import type { CrmConnection } from "../../types";
import type { BookingProviderConnectionMetadata } from "../booking-provider";
import { getTranslator } from "@/lib/i18n/server";

type BookingProviderConnectionPanelProps = {
  callbackFailed?: boolean;
  connection: CrmConnection;
  metadata: BookingProviderConnectionMetadata;
  organizationId: string;
};

export async function BookingProviderConnectionPanel({
  callbackFailed = false,
  connection,
  metadata,
  organizationId,
}: BookingProviderConnectionPanelProps) {
  const t = await getTranslator();
  if (metadata.configurationMode === "encrypted_credentials") {
    return (
      <YclientsMarketplaceConnectionPanel
        callbackFailed={callbackFailed}
        connection={connection}
        organizationId={organizationId}
      />
    );
  }

  return (
    <>
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-950">
          {t("Connection settings")}
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {t(metadata.settingsDescription)}
        </p>
        <CrmConnectionForm
          connection={connection}
          mode="update"
          organizationId={organizationId}
        />
      </section>
      <CrmConnectionControls
        connectionId={connection.id}
        organizationId={organizationId}
        status={connection.status}
      />
    </>
  );
}
