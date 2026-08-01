import { notFound } from "next/navigation";

import { OrganizationDashboard } from "@/features/organizations/components/organization-dashboard";
import { OrganizationForm } from "@/features/organizations/components/organization-form";
import { OrganizationWorkspaceNavigation } from "@/features/organizations/components/organization-workspace-navigation";
import { getOrganizationDashboardData } from "@/features/organizations/queries/organization-dashboard";
import { getOrganizationForCurrentUser } from "@/features/organizations/queries/organizations";
import { organizationIdSchema } from "@/features/organizations/validation/organization";
import { getLocale, getTranslator } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

type OrganizationPageProps = {
  params: Promise<{
    organizationId: string;
  }>;
};

export default async function OrganizationPage({
  params,
}: OrganizationPageProps) {
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
  const [dashboardData, locale, t] = await Promise.all([
    getOrganizationDashboardData(organization.id),
    getLocale(),
    getTranslator(),
  ]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-5 sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <OrganizationWorkspaceNavigation
          activeSection="overview"
          organization={organization}
        />

        <OrganizationDashboard
          data={dashboardData}
          locale={locale}
          organization={organization}
        />

        <section
          className="mt-8 scroll-mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
          id="organization-settings"
        >
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            {t("Organization settings")}
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {t(
              "Owners and admins may update operational organization fields.",
            )}
          </p>
          <OrganizationForm mode="update" organization={organization} />
        </section>
      </div>
    </main>
  );
}
