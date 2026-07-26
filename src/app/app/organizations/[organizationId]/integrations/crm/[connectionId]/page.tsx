import Link from "next/link";
import { notFound } from "next/navigation";

import { CrmConnectionControls } from "@/features/crm-connections/components/crm-connection-controls";
import { CrmConnectionForm } from "@/features/crm-connections/components/crm-connection-form";
import { getCrmConnection } from "@/features/crm-connections/queries/crm-connections";
import { crmConnectionIdSchema } from "@/features/crm-connections/validation/crm-connection";
import { OrganizationWorkspaceNavigation } from "@/features/organizations/components/organization-workspace-navigation";
import { getOrganizationForCurrentUser } from "@/features/organizations/queries/organizations";
import { organizationIdSchema } from "@/features/organizations/validation/organization";

export const dynamic = "force-dynamic";

type CrmConnectionPageProps = {
  params: Promise<{
    connectionId: string;
    organizationId: string;
  }>;
};

function formatTimestamp(value: string | null): string {
  if (!value) {
    return "Never";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function CrmConnectionPage({
  params,
}: CrmConnectionPageProps) {
  const { connectionId, organizationId } = await params;
  const parsedOrganizationId = organizationIdSchema.safeParse(organizationId);
  const parsedConnectionId = crmConnectionIdSchema.safeParse(connectionId);

  if (!parsedOrganizationId.success || !parsedConnectionId.success) {
    notFound();
  }

  const organization = await getOrganizationForCurrentUser(
    parsedOrganizationId.data,
  );

  if (!organization) {
    notFound();
  }

  const connection = await getCrmConnection(
    organization.id,
    parsedConnectionId.data,
  );

  if (!connection) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 sm:px-10">
      <div className="mx-auto w-full max-w-5xl">
        <OrganizationWorkspaceNavigation
          activeSection="integrations"
          organization={organization}
        />

        <section className="mt-9">
          <Link
            className="text-sm font-semibold text-indigo-700 hover:text-indigo-900"
            href={`/app/organizations/${organization.id}/integrations/crm`}
          >
            ← CRM connections
          </Link>

          <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                {connection.displayName}
              </h2>
              <p className="mt-3 text-sm text-slate-600">
                Custom placeholder · Last sync:{" "}
                {formatTimestamp(connection.lastSyncAt)}
              </p>
            </div>
            <span className="rounded-full bg-amber-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-amber-700">
              {connection.status}
            </span>
          </div>
        </section>

        <div className="mt-8 grid gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-950">
              Connection settings
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Only controlled, non-secret placeholder configuration is stored.
            </p>
            <CrmConnectionForm
              connection={connection}
              mode="update"
              organizationId={organization.id}
            />
          </section>

          <CrmConnectionControls
            connectionId={connection.id}
            organizationId={organization.id}
            status={connection.status}
          />
        </div>
      </div>
    </main>
  );
}
