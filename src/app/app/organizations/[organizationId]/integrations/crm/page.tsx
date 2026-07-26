import Link from "next/link";
import { notFound } from "next/navigation";

import { listCrmConnections } from "@/features/crm-connections/queries/crm-connections";
import type { CrmConnectionStatus } from "@/features/crm-connections/types";
import { OrganizationWorkspaceNavigation } from "@/features/organizations/components/organization-workspace-navigation";
import { getOrganizationForCurrentUser } from "@/features/organizations/queries/organizations";
import { organizationIdSchema } from "@/features/organizations/validation/organization";

export const dynamic = "force-dynamic";

type CrmConnectionsPageProps = {
  params: Promise<{
    organizationId: string;
  }>;
  searchParams: Promise<{
    deleted?: string;
  }>;
};

function formatLastSync(value: string | null): string {
  if (!value) {
    return "Never";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusClass(status: CrmConnectionStatus): string {
  switch (status) {
    case "connected":
      return "bg-emerald-50 text-emerald-700";
    case "error":
      return "bg-rose-50 text-rose-700";
    case "disconnected":
      return "bg-slate-100 text-slate-600";
    case "draft":
      return "bg-amber-50 text-amber-700";
  }
}

export default async function CrmConnectionsPage({
  params,
  searchParams,
}: CrmConnectionsPageProps) {
  const [{ organizationId }, query] = await Promise.all([
    params,
    searchParams,
  ]);
  const parsedOrganizationId = organizationIdSchema.safeParse(organizationId);

  if (!parsedOrganizationId.success) {
    notFound();
  }

  const organization = await getOrganizationForCurrentUser(
    parsedOrganizationId.data,
  );

  if (!organization) {
    notFound();
  }

  const connections = await listCrmConnections(organization.id);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 sm:px-10">
      <div className="mx-auto w-full max-w-5xl">
        <OrganizationWorkspaceNavigation
          activeSection="integrations"
          organization={organization}
        />

        <section className="mt-9">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Link
                className="text-sm font-semibold text-indigo-700 hover:text-indigo-900"
                href={`/app/organizations/${organization.id}/integrations`}
              >
                ← Integrations
              </Link>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
                CRM connections
              </h2>
              <p className="mt-3 max-w-2xl leading-7 text-slate-600">
                These records are placeholders for future provider adapters.
                The external CRM remains the source of truth.
              </p>
            </div>
            <Link
              className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
              href={`/app/organizations/${organization.id}/integrations/crm/new`}
            >
              New CRM connection
            </Link>
          </div>

          {query.deleted === "1" ? (
            <p
              className="mt-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
              role="status"
            >
              CRM connection deleted.
            </p>
          ) : null}

          <div className="mt-7 space-y-4">
            {connections.length ? (
              connections.map((connection) => (
                <Link
                  className="block rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
                  href={`/app/organizations/${organization.id}/integrations/crm/${connection.id}`}
                  key={connection.id}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-950">
                        {connection.displayName}
                      </h3>
                      <p className="mt-2 text-sm text-slate-600">
                        Provider: Custom placeholder
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Last sync: {formatLastSync(connection.lastSyncAt)}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusClass(connection.status)}`}
                    >
                      {connection.status}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <h3 className="text-lg font-semibold text-slate-950">
                  No CRM connections
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Create a placeholder record to prepare the integration
                  boundary.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
