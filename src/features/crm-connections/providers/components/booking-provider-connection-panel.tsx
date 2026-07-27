import { CrmConnectionControls } from "../../components/crm-connection-controls";
import { CrmConnectionForm } from "../../components/crm-connection-form";
import { YclientsConnectionForm } from "../../components/yclients-connection-form";
import { YclientsCredentialsControls } from "../../components/yclients-credentials-controls";
import type { CrmConnection } from "../../types";
import type { BookingProviderConnectionMetadata } from "../booking-provider";
import { getTranslator } from "@/lib/i18n/server";

type BookingProviderConnectionPanelProps = {
  connection: CrmConnection;
  metadata: BookingProviderConnectionMetadata;
  organizationId: string;
};

export async function BookingProviderConnectionPanel({
  connection,
  metadata,
  organizationId,
}: BookingProviderConnectionPanelProps) {
  const t = await getTranslator();
  const settingsForm =
    metadata.configurationMode === "encrypted_credentials" ? (
      <YclientsConnectionForm
        connection={connection}
        mode="update"
        organizationId={organizationId}
      />
    ) : (
      <CrmConnectionForm
        connection={connection}
        mode="update"
        organizationId={organizationId}
      />
    );
  const controls =
    metadata.configurationMode === "encrypted_credentials" ? (
      <YclientsCredentialsControls
        connectionId={connection.id}
        credentialsSaved={metadata.credentialsSaved}
        organizationId={organizationId}
      />
    ) : (
      <CrmConnectionControls
        connectionId={connection.id}
        organizationId={organizationId}
        status={connection.status}
      />
    );

  return (
    <>
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-950">
          {t("Connection settings")}
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {t(metadata.settingsDescription)}
        </p>
        {settingsForm}
      </section>
      {controls}
    </>
  );
}
