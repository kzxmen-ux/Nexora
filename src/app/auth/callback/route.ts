import { type NextRequest, NextResponse } from "next/server";

import { markPasswordRecoveryCallback } from "@/lib/auth/recovery";
import { getSafeRedirectPath } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/server";

const MAXIMUM_AUTH_CODE_LENGTH = 2048;

function createRedirectResponse(
  request: NextRequest,
  pathname: string,
  searchParams?: Readonly<Record<string, string>>,
): NextResponse {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = pathname;
  redirectUrl.search = "";

  Object.entries(searchParams ?? {}).forEach(([name, value]) => {
    redirectUrl.searchParams.set(name, value);
  });

  return NextResponse.redirect(redirectUrl);
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const code = request.nextUrl.searchParams.get("code");
  const nextPath = getSafeRedirectPath(
    request.nextUrl.searchParams.get("next"),
    "/app",
  );

  if (!code || code.length > MAXIMUM_AUTH_CODE_LENGTH) {
    return createRedirectResponse(request, "/auth/sign-in", {
      error: "invalid_callback",
    });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return createRedirectResponse(request, "/auth/sign-in", {
      error: "invalid_callback",
    });
  }

  const response = createRedirectResponse(request, nextPath);

  if (nextPath === "/auth/update-password") {
    markPasswordRecoveryCallback(response);
  }

  return response;
}
