import Link from "next/link";

import { getTranslator } from "@/lib/i18n/server";

type IntegrationCardProps = {
  description: string;
  href: string;
  name: string;
  status: string;
};

export async function IntegrationCard({
  description,
  href,
  name,
  status,
}: IntegrationCardProps) {
  const t = await getTranslator();

  return (
    <Link
      className="block rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
      href={href}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-2xl font-semibold text-slate-950">{name}</h2>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
          {status}
        </span>
      </div>
      <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
        {description}
      </p>
      <span className="mt-6 inline-flex text-sm font-semibold text-indigo-700">
        {t("Open integration →")}
      </span>
    </Link>
  );
}
