import Link from "next/link";
import type { ReactNode } from "react";

import { getTranslator } from "@/lib/i18n/server";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const t = await getTranslator();

  return (
    <main className="relative isolate flex min-h-screen flex-col bg-slate-50 px-6 py-8 sm:px-10">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.14),transparent_62%)]"
      />

      <Link
        className="mx-auto flex w-full max-w-5xl items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600"
        href="/"
      >
        <span
          aria-hidden="true"
          className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20"
        >
          N
        </span>
        <div>
          <p className="font-semibold tracking-tight text-slate-950">Nexora</p>
          <p className="text-sm text-slate-500">{t("AI Manager")}</p>
        </div>
      </Link>

      <div className="flex flex-1 items-center justify-center py-12">
        {children}
      </div>
    </main>
  );
}
