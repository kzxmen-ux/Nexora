import Link from "next/link";
import { cookies } from "next/headers";

import {
  getCanonicalAltegioCallbackPath,
  validateAltegioCallbackIds,
} from "@/features/crm-connections/providers/altegio/callback-validation";
import { ALTEGIO_MARKETPLACE_ORGANIZATION_COOKIE } from "@/features/crm-connections/marketplace/altegio";
import {
  getOrganizationForCurrentUser,
  listOrganizationsForCurrentUser,
} from "@/features/organizations/queries/organizations";
import { organizationIdSchema } from "@/features/organizations/validation/organization";
import { getTranslator } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type AltegioCallbackPageProps = {
  searchParams: Promise<{
    salon_id?: string | string[];
    "salon_ids[]"?: string | string[];
  }>;
};

export default async function AltegioCallbackPage({
  searchParams,
}: AltegioCallbackPageProps) {
  const t = await getTranslator();
  const params = await searchParams;
  const callbackInput = {
    salonId: params.salon_id,
    salonIds: params["salon_ids[]"],
  };
  const canonicalPath = getCanonicalAltegioCallbackPath(callbackInput);
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    const signInHref = canonicalPath
      ? `/auth/sign-in?next=${encodeURIComponent(canonicalPath)}`
      : "/auth/sign-in";

    return (
      <CallbackShell>
        <h1 className="text-3xl font-semibold text-slate-950">
          {t("Authentication required")}
        </h1>
        <p className="mt-4 leading-7 text-slate-600">
          {t("Sign in to continue connecting Altegio.")}
        </p>
        <Link
          className="mt-7 inline-flex rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
          href={signInHref}
        >
          {t("Sign in")}
        </Link>
      </CallbackShell>
    );
  }

  const validation = validateAltegioCallbackIds(callbackInput);

  if (!validation.success) {
    return (
      <CallbackShell>
        <h1 className="text-3xl font-semibold text-slate-950">
          {t("Altegio callback is invalid")}
        </h1>
        <p className="mt-4 leading-7 text-slate-600">
          {t(
            "The location identifiers are missing or invalid. Return to Altegio and try again.",
          )}
        </p>
      </CallbackShell>
    );
  }

  const cookieStore = await cookies();
  const selectedOrganizationId = organizationIdSchema.safeParse(
    cookieStore.get(ALTEGIO_MARKETPLACE_ORGANIZATION_COOKIE)?.value,
  );
  const selectedOrganization = selectedOrganizationId.success
    ? await getOrganizationForCurrentUser(selectedOrganizationId.data)
    : null;
  const organizations = selectedOrganizationId.success
    ? selectedOrganization
      ? [selectedOrganization]
      : []
    : await listOrganizationsForCurrentUser();

  if (organizations.length === 0) {
    return (
      <CallbackShell>
        <h1 className="text-3xl font-semibold text-slate-950">
          {t("Organization access required")}
        </h1>
        <p className="mt-4 leading-7 text-slate-600">
          {t(
            "You need owner or administrator access to an organization before connecting Altegio.",
          )}
        </p>
        <Link
          className="mt-7 inline-flex rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-800 hover:bg-slate-50"
          href="/app"
        >
          {t("Open organizations")}
        </Link>
      </CallbackShell>
    );
  }

  return (
    <CallbackShell>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">
        Altegio
      </p>
      <h1 className="mt-3 text-3xl font-semibold text-slate-950">
        {t("Altegio locations received")}
      </h1>
      <p className="mt-4 leading-7 text-slate-600">
        {t(
          "Altegio returned the selected locations to Orqelio. Final activation is not completed yet, and Orqelio has not connected to the Altegio API.",
        )}
      </p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {validation.locationIds.map((locationId) => (
          <li
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-900"
            key={locationId}
          >
            {locationId}
          </li>
        ))}
      </ul>
      <div className="mt-7 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
        {t("Activation and data synchronization are not enabled yet.")}
      </div>
      <Link
        className="mt-7 inline-flex rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
        href={`/app/organizations/${organizations[0].id}/integrations/crm`}
      >
        {t("Open integrations")}
      </Link>
    </CallbackShell>
  );
}

function CallbackShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-6 py-12">
      <section className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <Link
          className="mb-8 inline-flex items-center gap-3 font-semibold text-slate-950"
          href="/"
        >
          <span
            aria-hidden="true"
            className="grid size-9 place-items-center rounded-xl bg-indigo-600 text-sm text-white"
          >
            O
          </span>
          Orqelio
        </Link>
        {children}
      </section>
    </main>
  );
}
