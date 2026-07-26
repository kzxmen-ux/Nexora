import type { Metadata } from "next";
import { Geist } from "next/font/google";

import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { getLocale } from "@/lib/i18n/server";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();

  return locale === "kk"
    ? {
        title: "Nexora — ЖИ-менеджер",
        description:
          "Бизнестің қолданыстағы CRM жүйесімен және хабар алмасу платформаларымен жұмыс істейтін ЖИ-менеджер.",
      }
    : {
        title: "Nexora — ИИ-менеджер",
        description:
          "ИИ-менеджер, который работает с существующей CRM бизнеса и платформами обмена сообщениями.",
      };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale} className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full">
        <LocaleProvider initialLocale={locale}>
          {children}
          <LanguageSwitcher />
        </LocaleProvider>
      </body>
    </html>
  );
}
