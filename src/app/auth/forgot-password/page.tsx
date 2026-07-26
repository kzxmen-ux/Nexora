import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";
import { AuthForm } from "@/components/auth/auth-form";
import { redirectAuthenticatedUser } from "@/lib/auth/guards";
import { getTranslator } from "@/lib/i18n/server";

export default async function ForgotPasswordPage() {
  await redirectAuthenticatedUser();
  const t = await getTranslator();

  return (
    <AuthCard
      description={t(
        "Enter your email and we will send password reset instructions if the account exists.",
      )}
      footer={
        <Link
          className="font-semibold text-indigo-600 hover:text-indigo-700"
          href="/auth/sign-in"
        >
          {t("Return to sign in")}
        </Link>
      }
      title={t("Reset your password")}
    >
      <AuthForm variant="forgot-password" />
    </AuthCard>
  );
}
