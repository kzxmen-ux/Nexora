"use client";

import { usePathname } from "next/navigation";

import { type Locale } from "@/lib/i18n/config";

import { useLocale } from "./locale-provider";

const OPTIONS: Array<{ label: string; value: Locale }> = [
  { label: "Русский", value: "ru" },
  { label: "Қазақша", value: "kk" },
];

type LanguageSwitcherProps = {
  variant?: "floating" | "inline";
};

export function LanguageSwitcher({
  variant = "floating",
}: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useLocale();
  const pathname = usePathname();

  if (variant === "floating" && pathname === "/") {
    return null;
  }

  return (
    <div
      className={
        variant === "floating"
          ? "fixed bottom-4 right-4 z-50 rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-lg backdrop-blur"
          : "rounded-xl border border-slate-200 bg-white p-1 shadow-sm"
      }
    >
      <span className="sr-only">{t("Language")}</span>
      <div className="flex gap-1" role="group" aria-label={t("Language")}>
        {OPTIONS.map((option) => {
          const active = locale === option.value;

          return (
            <button
              aria-pressed={active}
              className={
                active
                  ? "rounded-lg bg-slate-950 px-2.5 py-1.5 text-xs font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                  : "rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              }
              key={option.value}
              onClick={() => setLocale(option.value)}
              type="button"
            >
              {t(option.label)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
