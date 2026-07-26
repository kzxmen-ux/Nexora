import { notFound } from "next/navigation";

import { IntegrationCard } from "@/features/integrations/components/integration-card";
import { OrganizationWorkspaceNavigation } from "@/features/organizations/components/organization-workspace-navigation";
import { getOrganizationForCurrentUser } from "@/features/organizations/queries/organizations";
import { organizationIdSchema } from "@/features/organizations/validation/organization";

export const dynamic = "force-dynamic";

type IntegrationsPageProps = {
  params: Promise<{
    organizationId: string;
  }>;
};

export default async function IntegrationsPage({
  params,
}: IntegrationsPageProps) {
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

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 sm:px-10">
      <div className="mx-auto w-full max-w-5xl">
        <OrganizationWorkspaceNavigation
          activeSection="integrations"
          organization={organization}
        />

        <section className="mt-9">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
            Integrations
          </h2>
          <p className="mt-3 max-w-2xl leading-7 text-slate-600">
            Connect Nexora to external systems without copying their
            operational data into this workspace.
          </p>

          <div className="mt-7">
            <IntegrationCard
              description="Create and manage provider-neutral CRM connection metadata. A real CRM adapter has not been selected or implemented."
              href={`/app/organizations/${organization.id}/integrations/crm`}
              name="CRM connections"
              status="Foundation"
            />
          </div>
        </section>
      </div>
    </main>
  );
}
