import Link from "next/link";

import { getTranslator } from "@/lib/i18n/server";

export default async function NotFound() {
  const t = await getTranslator();

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-6 py-12">
      <section className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">
          404
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          {t("Page not found")}
        </h1>
        <p className="mt-4 leading-7 text-slate-600">
          {t(
            "The requested page does not exist or you do not have access to it.",
          )}
        </p>
        <Link
          className="mt-7 inline-flex rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
          href="/"
        >
          {t("Return to home")}
        </Link>
      </section>
    </main>
  );
}
