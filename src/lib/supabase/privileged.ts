import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { getPublicEnvironment } from "@/lib/env/public";
import { getSupabaseSecretKey } from "@/lib/env/server";

export function createPrivilegedClient() {
  const environment = getPublicEnvironment();

  return createSupabaseClient(
    environment.supabaseUrl,
    getSupabaseSecretKey(),
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    },
  );
}
