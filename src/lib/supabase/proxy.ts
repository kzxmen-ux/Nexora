import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getPublicEnvironment } from "@/lib/env/public";

const AUTH_CACHE_HEADERS = ["cache-control", "expires", "pragma"] as const;

function redirectWithSessionCookies(
  request: NextRequest,
  supabaseResponse: NextResponse,
  pathname: string,
  searchParams?: Readonly<Record<string, string>>,
): NextResponse {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = pathname;
  redirectUrl.search = "";

  Object.entries(searchParams ?? {}).forEach(([name, value]) => {
    redirectUrl.searchParams.set(name, value);
  });

  const redirectResponse = NextResponse.redirect(redirectUrl);

  supabaseResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  AUTH_CACHE_HEADERS.forEach((headerName) => {
    const value = supabaseResponse.headers.get(headerName);

    if (value) {
      redirectResponse.headers.set(headerName, value);
    }
  });

  return redirectResponse;
}

export async function updateSession(
  request: NextRequest,
): Promise<NextResponse> {
  const environment = getPublicEnvironment();
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    environment.supabaseUrl,
    environment.supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          supabaseResponse = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });

          Object.entries(headers).forEach(([name, value]) => {
            supabaseResponse.headers.set(name, value);
          });
        },
      },
    },
  );

  const { data, error } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims) && !error;
  const pathname = request.nextUrl.pathname;

  if (!isAuthenticated && pathname.startsWith("/app")) {
    return redirectWithSessionCookies(
      request,
      supabaseResponse,
      "/auth/sign-in",
      { next: "/app" },
    );
  }

  if (
    isAuthenticated &&
    (pathname === "/auth/sign-in" || pathname === "/auth/sign-up")
  ) {
    return redirectWithSessionCookies(request, supabaseResponse, "/app");
  }

  return supabaseResponse;
}
