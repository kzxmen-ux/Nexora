import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";
import { AuthForm } from "@/components/auth/auth-form";
import { redirectAuthenticatedUser } from "@/lib/auth/guards";
import { getSafeRedirectPath } from "@/lib/auth/redirects";

type SignInPageProps = {
  searchParams: Promise<{
    error?: string | string[];
    next?: string | string[];
  }>;
};

export default async function SignInPage({
  searchParams,
}: SignInPageProps) {
  await redirectAuthenticatedUser();

  const params = await searchParams;
  const nextPath = getSafeRedirectPath(params.next, "/app");
  const signUpHref =
    nextPath === "/app"
      ? "/auth/sign-up"
      : `/auth/sign-up?next=${encodeURIComponent(nextPath)}`;
  const hasCallbackError = params.error === "invalid_callback";

  return (
    <AuthCard
      description="Use your email and password to continue to Nexora."
      footer={
        <>
          New to Nexora?{" "}
          <Link
            className="font-semibold text-indigo-600 hover:text-indigo-700"
            href={signUpHref}
          >
            Create an account
          </Link>
        </>
      }
      title="Welcome back"
    >
      <AuthForm
        initialMessage={
          hasCallbackError
            ? {
                message:
                  "The authentication link is invalid or expired. Try again.",
                status: "error",
              }
            : undefined
        }
        nextPath={nextPath}
        variant="sign-in"
      />
      <Link
        className="mt-5 block text-center text-sm font-medium text-indigo-600 hover:text-indigo-700"
        href="/auth/forgot-password"
      >
        Forgot your password?
      </Link>
    </AuthCard>
  );
}
