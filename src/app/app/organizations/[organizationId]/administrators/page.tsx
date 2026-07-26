import { notFound } from "next/navigation";

import { AdministratorActionButton } from "@/features/organizations/components/administrator-action-button";
import { InvitationForm } from "@/features/organizations/components/invitation-form";
import { OrganizationWorkspaceNavigation } from "@/features/organizations/components/organization-workspace-navigation";
import { getAdministratorManagementData } from "@/features/organizations/queries/administrators";
import { getOrganizationForCurrentUser } from "@/features/organizations/queries/organizations";
import { organizationIdSchema } from "@/features/organizations/validation/organization";
import { getLocale, getTranslator } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

type AdministratorsPageProps = {
  params: Promise<{
    organizationId: string;
  }>;
};

function formatDate(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function AdministratorsPage({
  params,
}: AdministratorsPageProps) {
  const { organizationId } = await params;
  const parsedOrganizationId = organizationIdSchema.safeParse(organizationId);

  if (!parsedOrganizationId.success) {
    notFound();
  }

  const organization = await getOrganizationForCurrentUser(
    parsedOrganizationId.data,
  );

  if (!organization || organization.role !== "owner") {
    notFound();
  }

  const management = await getAdministratorManagementData(organization.id);
  const [locale, t] = await Promise.all([getLocale(), getTranslator()]);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 sm:px-10">
      <div className="mx-auto w-full max-w-5xl">
        <OrganizationWorkspaceNavigation
          activeSection="administrators"
          organization={organization}
        />

        <header className="mt-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">
            {t("Owner settings")}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
            {t("Administrators")}
          </h1>
          <p className="mt-4 max-w-2xl leading-7 text-slate-600">
            {t(
              "Invite administrators with a one-time link and remove active administrators. Only organization owners can access this page.",
            )}
          </p>
        </header>

        {management.loadError ? (
          <p
            className="mt-8 rounded-2xl bg-rose-50 px-5 py-4 text-sm text-rose-700"
            role="alert"
          >
            {t(
              "Administrator settings could not be loaded. Try again later.",
            )}
          </p>
        ) : (
          <>
            <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-semibold text-slate-950">
                {t("Invite an administrator")}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {t(
                  "The link expires after seven days. Nexora stores only its cryptographic hash, so copy it immediately.",
                )}
              </p>
              <InvitationForm organizationId={organization.id} />
            </section>

            <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-semibold text-slate-950">
                {t("Active administrators")}
              </h2>
              <div className="mt-6 space-y-3">
                {management.administrators.length ? (
                  management.administrators.map((administrator) => (
                    <div
                      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4"
                      key={administrator.userId}
                    >
                      <div>
                        <p className="font-medium text-slate-950">
                          {administrator.email}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {t("Added")}{" "}
                          {formatDate(administrator.createdAt, locale)}
                        </p>
                      </div>
                      <AdministratorActionButton
                        mode="remove"
                        organizationId={organization.id}
                        userId={administrator.userId}
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-600">
                    {t("No active administrators.")}
                  </p>
                )}
              </div>
            </section>

            <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-semibold text-slate-950">
                {t("Invitation history")}
              </h2>
              <div className="mt-6 space-y-3">
                {management.invitations.length ? (
                  management.invitations.map((invitation) => (
                    <div
                      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4"
                      key={invitation.id}
                    >
                      <div>
                        <p className="font-medium text-slate-950">
                          {invitation.email}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {invitation.status === "pending"
                            ? `${t("Expires")} ${formatDate(invitation.expiresAt, locale)}`
                            : `${t("Created")} ${formatDate(invitation.createdAt, locale)}`}
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                          {t(invitation.status)}
                        </span>
                        {invitation.status === "pending" ? (
                          <AdministratorActionButton
                            invitationId={invitation.id}
                            mode="revoke"
                            organizationId={organization.id}
                          />
                        ) : null}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-600">
                    {t("No invitations have been created.")}
                  </p>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
