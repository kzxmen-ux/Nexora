import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function redirectAuthenticatedUser(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (user && !error) {
    redirect("/app");
  }
}
