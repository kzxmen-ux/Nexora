import Link from "next/link";
import { notFound } from "next/navigation";

import { OrganizationForm } from "@/features/organizations/components/organization-form";
import { getOrganizationForCurrentUser } from "@/features/organizations/queries/organizations";
import { organizationIdSchema } from "@/features/organizations/validation/organization";

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

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 sm:px-10">
      <div className="mx-auto w-full max-w-4xl">
        <Link
          className="text-sm font-semibold text-indigo-700 hover:text-indigo-900"
          href="/app"
        >
          ← All organizations
        </Link>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">
                Organization
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                {organization.name}
              </h1>
            </div>
            <span className="rounded-full bg-indigo-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-indigo-700">
              {organization.role}
            </span>
          </div>

          <p className="mt-5 max-w-2xl leading-7 text-slate-600">
            This page is loaded only after Supabase RLS and a server-side
            membership query authorize access.
          </p>
        </section>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            Organization settings
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Owners and admins may update operational organization fields.
          </p>
          <OrganizationForm mode="update" organization={organization} />
        </section>

        {organization.role === "owner" ? (
          <section className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-8 sm:p-10">
            <h2 className="text-xl font-semibold text-slate-950">
              Administrator management foundation
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Secure owner-only database operations are ready. The invitation
              interface is intentionally deferred until an email invitation
              flow is implemented.
            </p>
          </section>
        ) : null}
      </div>
    </main>
  );
}
