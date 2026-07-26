import Link from "next/link";
import { notFound } from "next/navigation";

import { CrmConnectionForm } from "@/features/crm-connections/components/crm-connection-form";
import { OrganizationWorkspaceNavigation } from "@/features/organizations/components/organization-workspace-navigation";
import { getOrganizationForCurrentUser } from "@/features/organizations/queries/organizations";
import { organizationIdSchema } from "@/features/organizations/validation/organization";
import { getTranslator } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

type NewCrmConnectionPageProps = {
  params: Promise<{
    organizationId: string;
  }>;
};

export default async function NewCrmConnectionPage({
  params,
}: NewCrmConnectionPageProps) {
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
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
            {t("New CRM connection")}
          </h2>
          <p className="mt-3 leading-7 text-slate-600">
            {t(
              "Create a non-secret placeholder. This does not contact or connect to any real CRM provider.",
            )}
          </p>
          <CrmConnectionForm
            mode="create"
            organizationId={organization.id}
          />
        </section>
      </div>
    </main>
  );
}
