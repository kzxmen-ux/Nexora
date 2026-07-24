import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { signOutAction } from "@/features/auth/actions";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ApplicationPageProps = {
  searchParams: Promise<{
    password?: string | string[];
    signout?: string | string[];
  }>;
};

export default async function ApplicationPage({
  searchParams,
}: ApplicationPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (!user || error) {
    redirect("/auth/sign-in?next=/app");
  }

  const params = await searchParams;
  const passwordUpdated = params.password === "updated";
  const signOutFailed = params.signout === "failed";

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 sm:px-10">
      <div className="mx-auto w-full max-w-5xl">
        <header className="flex items-center justify-between gap-6 border-b border-slate-200 pb-6">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-sm font-semibold text-white"
            >
              N
            </span>
            <div>
              <p className="font-semibold tracking-tight text-slate-950">
                Nexora
              </p>
              <p className="text-sm text-slate-500">Protected application</p>
            </div>
          </div>

          <form action={signOutAction}>
            <SignOutButton />
          </form>
        </header>

        <section className="mt-16 max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          {passwordUpdated ? (
            <p
              className="mb-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
              role="status"
            >
              Your password has been updated.
            </p>
          ) : null}

          {signOutFailed ? (
            <p
              className="mb-6 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700"
              role="alert"
            >
              Sign out could not be completed. Try again.
            </p>
          ) : null}

          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">
            Secure session active
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
            Authentication foundation is ready
          </h1>
          <p className="mt-5 leading-7 text-slate-600">
            You are authenticated as{" "}
            <span className="font-medium text-slate-900">
              {user.email ?? "an authenticated user"}
            </span>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
