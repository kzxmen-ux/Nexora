import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { AuthForm } from "@/components/auth/auth-form";
import { hasPasswordRecoveryMarker } from "@/lib/auth/recovery";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function UpdatePasswordPage() {
  const hasRecoveryMarker = await hasPasswordRecoveryMarker();
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (!hasRecoveryMarker || !user || error) {
    redirect("/auth/sign-in?error=invalid_callback");
  }

  return (
    <AuthCard
      description="Choose a new password for your account."
      title="Update password"
    >
      <AuthForm variant="update-password" />
    </AuthCard>
  );
}
