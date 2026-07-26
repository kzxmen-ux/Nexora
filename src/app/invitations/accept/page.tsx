import Link from "next/link";

import { InvitationAcceptanceForm } from "@/features/organizations/components/invitation-acceptance-form";
import { invitationTokenSchema } from "@/features/organizations/validation/invitation";
import { getTranslator } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type InvitationAcceptancePageProps = {
  searchParams: Promise<{
    token?: string | string[];
  }>;
};

export default async function InvitationAcceptancePage({
  searchParams,
}: InvitationAcceptancePageProps) {
  const t = await getTranslator();
  const params = await searchParams;
  const tokenValidation = invitationTokenSchema.safeParse(params.token);

  if (!tokenValidation.success) {
    return (
      <InvitationShell>
        <h1 className="text-3xl font-semibold text-slate-950">
          {t("Invitation unavailable")}
        </h1>
        <p className="mt-4 leading-7 text-slate-600">
          {t(
            "This invitation link is invalid. Ask the organization owner for a new link.",
          )}
        </p>
      </InvitationShell>
    );
  }

  const token = tokenValidation.data;
  const nextPath = `/invitations/accept?token=${encodeURIComponent(token)}`;
  const signInHref = `/auth/sign-in?next=${encodeURIComponent(nextPath)}`;
  const signUpHref = `/auth/sign-up?next=${encodeURIComponent(nextPath)}`;
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return (
    <InvitationShell>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">
        {t("Administrator invitation")}
      </p>
      <h1 className="mt-3 text-3xl font-semibold text-slate-950">
        {t("Join an organization in Nexora")}
      </h1>
      {!user || error ? (
        <>
          <p className="mt-4 leading-7 text-slate-600">
            {t(
              "Sign in or create an account with the exact email address that received this invitation.",
            )}
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <Link
              className="rounded-xl bg-indigo-600 px-5 py-3 text-center font-semibold text-white hover:bg-indigo-700"
              href={signInHref}
            >
              {t("Sign in")}
            </Link>
            <Link
              className="rounded-xl border border-slate-300 px-5 py-3 text-center font-semibold text-slate-800 hover:bg-slate-50"
              href={signUpHref}
            >
              {t("Create account")}
            </Link>
          </div>
        </>
      ) : (
        <>
          <p className="mt-4 leading-7 text-slate-600">
            {t("Signed in as")}{" "}
            <span className="font-medium text-slate-900">
              {user.email ?? t("an authenticated user")}
            </span>
            . {t("The invitation can be accepted only if this email matches.")}
          </p>
          <InvitationAcceptanceForm token={token} />
        </>
      )}
    </InvitationShell>
  );
}

function InvitationShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-6 py-12">
      <section className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <Link
          className="mb-8 inline-flex items-center gap-3 font-semibold text-slate-950"
          href="/"
        >
          <span
            aria-hidden="true"
            className="grid size-9 place-items-center rounded-xl bg-indigo-600 text-sm text-white"
          >
            N
          </span>
          Nexora
        </Link>
        {children}
      </section>
    </main>
  );
}
