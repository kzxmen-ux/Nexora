import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { AuthForm } from "@/components/auth/auth-form";
import { hasPasswordRecoveryMarker } from "@/lib/auth/recovery";
import { getTranslator } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function UpdatePasswordPage() {
  const t = await getTranslator();
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
      description={t("Choose a new password for your account.")}
      title={t("Update password")}
    >
      <AuthForm variant="update-password" />
    </AuthCard>
  );
}
