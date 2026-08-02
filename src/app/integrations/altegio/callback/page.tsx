import Link from "next/link";
import { cookies } from "next/headers";

import { retryAltegioMarketplaceActivationAction } from "@/features/crm-connections/actions/altegio-marketplace";
import {
  ALTEGIO_MARKETPLACE_ORGANIZATION_COOKIE,
  hashAltegioMarketplaceState,
  parseAltegioMarketplaceCookie,
} from "@/features/crm-connections/marketplace/altegio";
import {
  getAltegioActivationState,
  runAltegioActivation,
} from "@/features/crm-connections/providers/altegio/activation.server";
import type { AltegioActivationResult } from "@/features/crm-connections/providers/altegio/activation-types";
import {
  getCanonicalAltegioCallbackPath,
  validateAltegioCallbackIds,
} from "@/features/crm-connections/providers/altegio/callback-validation";
import { getTranslator } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type AltegioCallbackPageProps = {
  searchParams: Promise<{
    resume?: string;
    salon_id?: string | string[];
    "salon_ids[]"?: string | string[];
  }>;
};

const stateCopy = {
  error: ["Altegio activation failed", "Altegio returned a safe provider error. You can retry while the authorization window is open."],
  expired: ["Altegio authorization expired", "Start the connection again from integrations to receive a new authorization window."],
  in_progress: ["Altegio activation is in progress", "Orqelio is activating and verifying the selected locations."],
  mismatch: ["Altegio callback does not match", "This callback does not match the selected organization or connection attempt."],
  partial: ["Altegio activation is partially complete", "Some locations were verified and some require a safe retry."],
  reused: ["Altegio callback was already used", "This one-time callback has already been processed. Open integrations to view the current state."],
  succeeded: ["Altegio activation completed", "All selected locations were activated and access was verified."],
  unavailable: ["Altegio activation is unavailable", "The connection attempt could not be verified. Start again from integrations."],
} as const;

export default async function AltegioCallbackPage({ searchParams }: AltegioCallbackPageProps) {
  const t = await getTranslator();
  const params = await searchParams;
  const callbackInput = { salonId: params.salon_id, salonIds: params["salon_ids[]"] };
  const canonicalPath = getCanonicalAltegioCallbackPath(callbackInput);
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (!user || userError) {
    const next = canonicalPath ?? "/integrations/altegio/callback?resume=1";
    return <CallbackMessage title={t("Authentication required")} description={t("Sign in to continue connecting Altegio.")} actionHref={`/auth/sign-in?next=${encodeURIComponent(next)}`} actionLabel={t("Sign in")} />;
  }

  const cookieStore = await cookies();
  const context = parseAltegioMarketplaceCookie(cookieStore.get(ALTEGIO_MARKETPLACE_ORGANIZATION_COOKIE)?.value);

  if (!context) {
    return <CallbackResult result={{ canRetry: false, connectionId: null, failedLocationIds: [], locationIds: [], organizationId: "", state: "unavailable", verifiedLocationIds: [] }} t={t} />;
  }

  const shared = {
    attemptId: context.attemptId,
    organizationId: context.organizationId,
    stateHash: hashAltegioMarketplaceState(context.state),
  };
  let result: AltegioActivationResult;

  if (params.resume === "1") {
    result = (await getAltegioActivationState(shared)) ?? { canRetry: false, connectionId: null, failedLocationIds: [], locationIds: [], organizationId: context.organizationId, state: "unavailable", verifiedLocationIds: [] };
  } else {
    const validation = validateAltegioCallbackIds(callbackInput);
    if (!validation.success) {
      return <CallbackMessage title={t("Altegio callback is invalid")} description={t("The location identifiers are missing or invalid. Return to Altegio and try again.")} />;
    }
    result = await runAltegioActivation({ ...shared, locationIds: validation.locationIds, mode: "callback" });
  }

  return <CallbackResult result={result} t={t} />;
}

function CallbackResult({ result, t }: { result: AltegioActivationResult; t: (key: string) => string }) {
  const [title, description] = stateCopy[result.state];
  const integrationsHref = result.organizationId ? `/app/organizations/${result.organizationId}/integrations/crm` : "/app";
  return (
    <CallbackShell>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">Altegio</p>
      <h1 className="mt-3 text-3xl font-semibold text-slate-950">{t(title)}</h1>
      <p className="mt-4 leading-7 text-slate-600">{t(description)}</p>
      {result.locationIds.length > 0 && (
        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <LocationList label={t("Verified locations")} ids={result.verifiedLocationIds} tone="success" />
          <LocationList label={t("Locations requiring attention")} ids={result.failedLocationIds} tone="error" />
        </div>
      )}
      <div className="mt-8 flex flex-wrap gap-3">
        {result.canRetry && <form action={retryAltegioMarketplaceActivationAction}><button className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600" type="submit">{t("Retry activation")}</button></form>}
        <Link className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-800 hover:bg-slate-50" href={integrationsHref}>{t("Open integrations")}</Link>
      </div>
    </CallbackShell>
  );
}

function LocationList({ ids, label, tone }: { ids: string[]; label: string; tone: "error" | "success" }) {
  return <section className={`rounded-2xl border p-4 ${tone === "success" ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}><h2 className="text-sm font-semibold text-slate-900">{label}</h2><p className="mt-2 break-words font-mono text-sm text-slate-700">{ids.length > 0 ? ids.join(", ") : "—"}</p></section>;
}

function CallbackMessage({ actionHref, actionLabel, description, title }: { actionHref?: string; actionLabel?: string; description: string; title: string }) {
  return <CallbackShell><h1 className="text-3xl font-semibold text-slate-950">{title}</h1><p className="mt-4 leading-7 text-slate-600">{description}</p>{actionHref && actionLabel && <Link className="mt-7 inline-flex rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700" href={actionHref}>{actionLabel}</Link>}</CallbackShell>;
}

function CallbackShell({ children }: { children: React.ReactNode }) {
  return <main className="grid min-h-screen place-items-center bg-slate-50 px-6 py-12"><section className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10"><Link className="mb-8 inline-flex items-center gap-3 font-semibold text-slate-950" href="/"><span aria-hidden="true" className="grid size-9 place-items-center rounded-xl bg-indigo-600 text-sm text-white">O</span>Orqelio</Link>{children}</section></main>;
}
