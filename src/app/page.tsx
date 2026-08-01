import type { Metadata } from "next";
import Link from "next/link";

import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import {
  LandingIcon,
  type LandingIconName,
} from "@/features/marketing/components/landing-icon";
import { ProductConversationPreview } from "@/features/marketing/components/product-conversation-preview";
import { getLocale, getTranslator } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const title =
    locale === "kk"
      ? "Orqelio — клиенттерді 24/7 жазатын ЖИ-әкімші"
      : "Orqelio — AI-администратор для записи клиентов 24/7";
  const description =
    locale === "kk"
      ? "Orqelio мессенджерлерде клиенттермен сөйлеседі, қызмет таңдауға көмектеседі және бизнестің қолданыстағы жазылу жүйесі арқылы уақыт табады."
      : "Orqelio общается с клиентами в мессенджерах, консультирует по услугам и помогает создавать записи через существующую систему бизнеса.";

  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { title, description },
  };
}

export default async function Home() {
  const t = await getTranslator();
  const benefits: Array<{
    description: string;
    icon: LandingIconName;
    title: string;
  }> = [
    {
      description: t("Clients do not wait for an administrator to reply."),
      icon: "message",
      title: t("Responds instantly"),
    },
    {
      description: t(
        "Orqelio checks services, staff, and available slots in the connected system.",
      ),
      icon: "calendar",
      title: t("Books accurately"),
    },
    {
      description: t(
        "New requests can be handled in the evening, at night, and on weekends.",
      ),
      icon: "clock",
      title: t("Works around the clock"),
    },
  ];
  const steps = [
    t("Connect your booking system"),
    t("Configure your business information"),
    t("Connect a messaging channel"),
    t("Orqelio starts answering and booking clients"),
  ];
  const audiences: Array<{ icon: LandingIconName; label: string }> = [
    { icon: "sparkles", label: t("Beauty salons") },
    { icon: "scissors", label: t("Barbershops") },
    { icon: "sparkles", label: t("Nail studios") },
    { icon: "medical", label: t("Cosmetology and clinics") },
    { icon: "spa", label: t("SPA and massage") },
    { icon: "paw", label: t("Grooming and wellness") },
  ];

  return (
    <main className="overflow-hidden bg-white text-slate-950">
      <header className="border-b border-slate-200/80 bg-white/95">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            aria-label="Orqelio"
            className="flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            href="/"
          >
            <span
              aria-hidden="true"
              className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-sm"
            >
              O
            </span>
            <span>
              <span className="block font-semibold tracking-tight">Orqelio</span>
              <span className="block text-xs text-slate-500">
                {t("AI administrator")}
              </span>
            </span>
          </Link>

          <nav
            aria-label={t("Public navigation")}
            className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2"
          >
            <LanguageSwitcher variant="inline" />
            <Link
              className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              href="/auth/sign-in"
            >
              {t("Sign in")}
            </Link>
            <Link
              className="rounded-xl bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 sm:px-4"
              href="/auth/sign-up"
            >
              {t("Start free")}
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative isolate border-b border-slate-200 bg-slate-50/80">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 -z-10 h-96 bg-[radial-gradient(circle_at_18%_12%,rgba(99,102,241,0.13),transparent_48%)]"
        />
        <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(440px,0.92fr)] lg:px-8 lg:py-24">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3.5 py-2 text-xs font-semibold text-indigo-700 shadow-sm">
              <LandingIcon className="size-4" name="sparkles" />
              {t("AI administrator for appointment businesses")}
            </p>
            <h1 className="mt-6 text-balance text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-[3.5rem] lg:leading-[1.08]">
              {t("An AI administrator that answers clients and books them 24/7")}
            </h1>
            <p className="mt-6 max-w-xl text-pretty text-lg leading-8 text-slate-600">
              {t(
                "Orqelio talks to clients in messengers, advises on services, finds available time, and creates a booking in your system without replacing the CRM you already use.",
              )}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                href="/auth/sign-up"
              >
                {t("Start free")}
              </Link>
              <Link
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-semibold text-slate-800 transition hover:border-indigo-300 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                href="#how-it-works"
              >
                {t("See how it works")}
              </Link>
            </div>
            <p className="mt-6 flex items-start gap-2 text-sm leading-6 text-slate-500">
              <LandingIcon className="mt-0.5 size-4 shrink-0 text-indigo-600" name="check" />
              {t(
                "For beauty salons, barbershops, clinics, SPA, and other appointment-based businesses.",
              )}
            </p>
          </div>

          <ProductConversationPreview
            bookingConfirmed={t("Booking confirmed")}
            clientLabel={t("Client")}
            clientMessage={t(
              "Hello, I would like to book a coloring appointment tomorrow.",
            )}
            exampleDisclaimer={t(
              "Illustration of the planned experience. Messaging and AI booking are not publicly launched yet.",
            )}
            plannedExperienceLabel={t("Planned experience")}
            productMessage={t(
              "Of course. Tomorrow there is availability at 14:00 and 17:30. Which time works for you?",
            )}
            serviceLabel={t("Coloring")}
            timeLabel={t("Tomorrow at 17:30")}
          />
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-700">
            {t("Benefits")}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            {t("Less waiting in every client conversation")}
          </h2>
        </div>
        <div className="mt-9 grid gap-5 md:grid-cols-3">
          {benefits.map((benefit) => (
            <article
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              key={benefit.title}
            >
              <span className="grid size-11 place-items-center rounded-xl bg-indigo-50 text-indigo-700">
                <LandingIcon name={benefit.icon} />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-slate-950">
                {benefit.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {benefit.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section
        className="border-y border-slate-200 bg-slate-50"
        id="how-it-works"
      >
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-700">
                {t("Planned workflow")}
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                {t("How Orqelio will work")}
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-600">
              {t(
                "These stages describe the planned process after the corresponding integrations are launched.",
              )}
            </p>
          </div>
          <ol className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <li
                className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                key={step}
              >
                <span className="grid size-8 place-items-center rounded-full bg-slate-950 text-xs font-bold text-white">
                  {index + 1}
                </span>
                <p className="mt-5 text-sm font-semibold leading-6 text-slate-900">
                  {step}
                </p>
                <span className="mt-4 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {index === 0 ? t("Foundation available") : t("Planned")}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-700">
            {t("For service businesses")}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            {t("Built for teams that work by appointment")}
          </h2>
        </div>
        <div className="mx-auto mt-9 grid max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {audiences.map((audience) => (
            <article
              className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5"
              key={audience.label}
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700">
                <LandingIcon name={audience.icon} />
              </span>
              <h3 className="text-sm font-semibold text-slate-900">
                {audience.label}
              </h3>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
        <div className="grid gap-8 rounded-3xl border border-slate-200 bg-slate-950 px-6 py-9 text-white sm:px-9 sm:py-11 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-12">
          <div className="flex items-center gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-indigo-500 text-white">
              <LandingIcon className="size-6" name="sparkles" />
            </span>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-300">
              {t("Works with your existing system")}
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {t("Does not replace your system — makes it smarter")}
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
              {t(
                "Services, staff, schedules, and bookings stay in your booking platform. Orqelio works on top of it and takes care of client communication.",
              )}
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-indigo-50/60">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-7 px-4 py-14 sm:px-6 sm:py-16 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              {t("Prepare your business for automatic client booking")}
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-600">
              {t("Create an organization and connect your first booking system.")}
            </p>
          </div>
          <Link
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            href="/auth/sign-up"
          >
            {t("Start setup")}
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-7 px-4 py-9 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-indigo-600 text-xs font-bold text-white">
                O
              </span>
              <span className="font-semibold text-slate-950">Orqelio</span>
            </div>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
              {t("AI administrator for appointment-based businesses in Kazakhstan.")}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              © {new Date().getFullYear()} Orqelio
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <LanguageSwitcher variant="inline" />
            <Link
              className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              href="/auth/sign-in"
            >
              {t("Sign in")}
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
