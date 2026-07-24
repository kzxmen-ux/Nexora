import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";
import { AuthForm } from "@/components/auth/auth-form";
import { redirectAuthenticatedUser } from "@/lib/auth/guards";

export default async function ForgotPasswordPage() {
  await redirectAuthenticatedUser();

  return (
    <AuthCard
      description="Enter your email and we will send password reset instructions if the account exists."
      footer={
        <Link
          className="font-semibold text-indigo-600 hover:text-indigo-700"
          href="/auth/sign-in"
        >
          Return to sign in
        </Link>
      }
      title="Reset your password"
    >
      <AuthForm variant="forgot-password" />
    </AuthCard>
  );
}
