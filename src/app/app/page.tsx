import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { signOutAction } from "@/features/auth/actions";
import { OrganizationForm } from "@/features/organizations/components/organization-form";
import { listOrganizationsForCurrentUser } from "@/features/organizations/queries/organizations";
import { getTranslator } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ApplicationPageProps = {
  searchParams: Promise<{
    password?: string | string[];
    signout?: string | string[];
    yclients?: string | string[];
  }>;
};

export default async function ApplicationPage({
  searchParams,
}: ApplicationPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (!user || error) {
    redirect("/auth/sign-in?next=/app");
  }
  const t = await getTranslator();

  const params = await searchParams;
  const passwordUpdated = params.password === "updated";
  const signOutFailed = params.signout === "failed";
  const yclientsFailed = params.yclients === "failed";
  const organizations = await listOrganizationsForCurrentUser();

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 sm:px-10">
      <div className="mx-auto w-full max-w-5xl">
        <header className="flex items-center justify-between gap-6 border-b border-slate-200 pb-6">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-sm font-semibold text-white"
            >
              O
            </span>
            <div>
              <p className="font-semibold tracking-tight text-slate-950">
                Orqelio
              </p>
              <p className="text-sm text-slate-500">
                {t("Protected application")}
              </p>
            </div>
          </div>

          <form action={signOutAction}>
            <SignOutButton />
          </form>
        </header>

        <section className="mt-12 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          {passwordUpdated ? (
            <p
              className="mb-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
              role="status"
            >
              {t("Your password has been updated.")}
            </p>
          ) : null}

          {signOutFailed ? (
            <p
              className="mb-6 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700"
              role="alert"
            >
              {t("Sign out could not be completed. Try again.")}
            </p>
          ) : null}

          {yclientsFailed ? (
            <p
              className="mb-6 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700"
              role="alert"
            >
              {t(
                "The YCLIENTS callback could not be completed. Open your organization and try again.",
              )}
            </p>
          ) : null}

          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">
            {t("Organizations")}
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
            {t("Choose your organization")}
          </h1>
          <p className="mt-5 leading-7 text-slate-600">
            {t("You are authenticated as")}{" "}
            <span className="font-medium text-slate-900">
              {user.email ?? t("an authenticated user")}
            </span>
            .
          </p>

          <div className="mt-8 grid gap-3">
            {organizations.length ? (
              organizations.map((organization) => (
                <a
                  className="flex items-center justify-between rounded-2xl border border-slate-200 px-5 py-4 transition hover:border-indigo-300 hover:bg-indigo-50"
                  href={`/app/organizations/${organization.id}`}
                  key={organization.id}
                >
                  <span>
                    <span className="block font-semibold text-slate-950">
                      {organization.name}
                    </span>
                    <span className="mt-1 block text-sm text-slate-500">
                      {organization.slug}
                    </span>
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    {t(organization.role)}
                  </span>
                </a>
              ))
            ) : (
              <p className="rounded-2xl bg-slate-50 px-5 py-4 text-sm text-slate-600">
                {t("You do not belong to an organization yet.")}
              </p>
            )}
          </div>
        </section>

        <section className="mt-8 max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            {t("Create an organization")}
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {t("You will become its owner automatically.")}
          </p>
          <OrganizationForm mode="create" />
        </section>
      </div>
    </main>
  );
}
