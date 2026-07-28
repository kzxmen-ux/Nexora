import Link from "next/link";
import { notFound } from "next/navigation";

import { YclientsConnectionForm } from "@/features/crm-connections/components/yclients-connection-form";
import { OrganizationWorkspaceNavigation } from "@/features/organizations/components/organization-workspace-navigation";
import { getOrganizationForCurrentUser } from "@/features/organizations/queries/organizations";
import { organizationIdSchema } from "@/features/organizations/validation/organization";
import { getTranslator } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

type NewYclientsConnectionPageProps = {
  params: Promise<{
    organizationId: string;
  }>;
};

export default async function NewYclientsConnectionPage({
  params,
}: NewYclientsConnectionPageProps) {
  const { organizationId } = await params;
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

  const t = await getTranslator();

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 sm:px-10">
      <div className="mx-auto w-full max-w-5xl">
        <OrganizationWorkspaceNavigation
          activeSection="integrations"
          organization={organization}
        />

        <section className="mt-9 max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <Link
            className="text-sm font-semibold text-indigo-700 hover:text-indigo-900"
            href={`/app/organizations/${organization.id}/integrations/crm`}
          >
            {t("← CRM connections")}
          </Link>
          <span className="mt-6 inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
            {t("Official integration")}
          </span>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
            {t("Set up YCLIENTS")}
          </h2>
          <p className="mt-3 leading-7 text-slate-600">
            {t(
              "Enter the non-secret Application ID and Company ID from the developer dashboard. After creating the connection, save the User Token securely.",
            )}
          </p>
          <YclientsConnectionForm
            mode="create"
            organizationId={organization.id}
          />
        </section>
      </div>
    </main>
  );
}
