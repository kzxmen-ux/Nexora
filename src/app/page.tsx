import Link from "next/link";

import { getTranslator } from "@/lib/i18n/server";

export default async function Home() {
  const t = await getTranslator();

  return (
    <main className="relative isolate flex min-h-screen items-center overflow-hidden px-6 py-16 sm:px-10">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.16),transparent_58%)]"
      />

      <section className="mx-auto w-full max-w-5xl">
        <header className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20"
            >
              N
            </span>
            <div>
              <p className="font-semibold tracking-tight text-slate-950">
                Nexora
              </p>
              <p className="text-sm text-slate-500">{t("AI Manager")}</p>
            </div>
          </div>

          <nav aria-label={t("Authentication")} className="flex items-center gap-3">
            <Link
              className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:text-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              href="/auth/sign-in"
            >
              {t("Sign in")}
            </Link>
            <Link
              className="hidden rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:inline-flex"
              href="/auth/sign-up"
            >
              {t("Get started")}
            </Link>
          </nav>
        </header>

        <div className="mt-20 max-w-3xl sm:mt-28">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">
            {t("Built around your existing systems")}
          </p>
          <h1 className="mt-5 text-balance text-5xl font-semibold tracking-[-0.045em] text-slate-950 sm:text-7xl">
            {t("An AI manager, not another CRM.")}
          </h1>
          <p className="mt-7 max-w-2xl text-pretty text-lg leading-8 text-slate-600 sm:text-xl">
            {t(
              "Nexora is designed to work on top of the CRM a business already trusts, connecting customer conversations with operational data without replacing the source of truth.",
            )}
          </p>
        </div>

        <div className="mt-14 inline-flex items-center gap-3 rounded-full border border-emerald-200 bg-white/80 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm backdrop-blur">
          <span
            aria-hidden="true"
            className="size-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]"
          />
          {t("Project foundation is ready")}
        </div>

        <footer className="mt-24 border-t border-slate-200 pt-6 text-sm text-slate-500 sm:mt-32">
          Next.js · TypeScript · Tailwind CSS
        </footer>
      </section>
    </main>
  );
}
