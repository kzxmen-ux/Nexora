import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";
import { AuthForm } from "@/components/auth/auth-form";
import { redirectAuthenticatedUser } from "@/lib/auth/guards";
import { getSafeRedirectPath } from "@/lib/auth/redirects";
import { getTranslator } from "@/lib/i18n/server";

type SignUpPageProps = {
  searchParams: Promise<{
    next?: string | string[];
  }>;
};

export default async function SignUpPage({
  searchParams,
}: SignUpPageProps) {
  await redirectAuthenticatedUser();
  const t = await getTranslator();

  const params = await searchParams;
  const nextPath = getSafeRedirectPath(params.next, "/app");
  const signInHref =
    nextPath === "/app"
      ? "/auth/sign-in"
      : `/auth/sign-in?next=${encodeURIComponent(nextPath)}`;

  return (
    <AuthCard
      description={t("Create the account that will manage your Orqelio access.")}
      footer={
        <>
          {t("Already have an account?")}{" "}
          <Link
            className="font-semibold text-indigo-600 hover:text-indigo-700"
            href={signInHref}
          >
            {t("Sign in")}
          </Link>
        </>
      }
      title={t("Create your account")}
    >
      <AuthForm nextPath={nextPath} variant="sign-up" />
    </AuthCard>
  );
}
