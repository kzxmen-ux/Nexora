import type { Metadata } from "next";
import { Geist } from "next/font/google";

import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { getPublicEnvironment } from "@/lib/env/public";
import { getLocale } from "@/lib/i18n/server";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const { appUrl } = getPublicEnvironment();
  const title =
    locale === "kk" ? "Orqelio — ЖИ-менеджер" : "Orqelio — ИИ-менеджер";
  const description =
    locale === "kk"
      ? "Orqelio — бизнестің қолданыстағы CRM жүйесімен және хабар алмасу платформаларымен жұмыс істейтін ЖИ-менеджер."
      : "Orqelio — ИИ-менеджер, который работает с существующей CRM бизнеса и платформами обмена сообщениями.";

  return {
    metadataBase: new URL(appUrl),
    applicationName: "Orqelio",
    title,
    description,
    manifest: "/manifest.webmanifest",
    alternates: {
      canonical: "/",
    },
    openGraph: {
      type: "website",
      siteName: "Orqelio",
      title,
      description,
      locale: locale === "kk" ? "kk_KZ" : "ru_RU",
      url: "/",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
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
