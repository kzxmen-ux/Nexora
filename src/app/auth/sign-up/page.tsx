import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";
import { AuthForm } from "@/components/auth/auth-form";
import { redirectAuthenticatedUser } from "@/lib/auth/guards";

export default async function SignUpPage() {
  await redirectAuthenticatedUser();

  return (
    <AuthCard
      description="Create the account that will manage your Nexora access."
      footer={
        <>
          Already have an account?{" "}
          <Link
            className="font-semibold text-indigo-600 hover:text-indigo-700"
            href="/auth/sign-in"
          >
            Sign in
          </Link>
        </>
      }
      title="Create your account"
    >
      <AuthForm variant="sign-up" />
    </AuthCard>
  );
}
