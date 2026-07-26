import { notFound } from "next/navigation";

import { OrganizationForm } from "@/features/organizations/components/organization-form";
import { OrganizationWorkspaceNavigation } from "@/features/organizations/components/organization-workspace-navigation";
import { getOrganizationForCurrentUser } from "@/features/organizations/queries/organizations";
import { organizationIdSchema } from "@/features/organizations/validation/organization";
import { getTranslator } from "@/lib/i18n/server";

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
  const t = await getTranslator();

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 sm:px-10">
      <div className="mx-auto w-full max-w-5xl">
        <OrganizationWorkspaceNavigation
          activeSection="overview"
          organization={organization}
        />

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            {t("Workspace overview")}
          </h2>
          <p className="mt-3 max-w-2xl leading-7 text-slate-600">
            {t(
              "This page is loaded only after Supabase RLS and a server-side membership query authorize access.",
            )}
          </p>
        </section>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
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
