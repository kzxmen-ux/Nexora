"use client";

import { type Locale } from "@/lib/i18n/config";

import { useLocale } from "./locale-provider";

const OPTIONS: Array<{ label: string; value: Locale }> = [
  { label: "Русский", value: "ru" },
  { label: "Қазақша", value: "kk" },
];

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();

  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-lg backdrop-blur">
      <span className="sr-only">{t("Language")}</span>
      <div className="flex gap-1" role="group" aria-label={t("Language")}>
        {OPTIONS.map((option) => {
          const active = locale === option.value;

          return (
            <button
              aria-pressed={active}
              className={
                active
                  ? "rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white"
                  : "rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
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
