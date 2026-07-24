import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getPublicEnvironment } from "@/lib/env/public";

function isReadOnlyCookieContextError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes("Cookies can only be modified") ||
      error.message.toLowerCase().includes("read-only"))
  );
}

export async function createClient() {
  const environment = getPublicEnvironment();
  const cookieStore = await cookies();

  return createServerClient(
    environment.supabaseUrl,
    environment.supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            if (!isReadOnlyCookieContextError(error)) {
              throw error;
            }
          }
        },
      },
    },
  );
}
