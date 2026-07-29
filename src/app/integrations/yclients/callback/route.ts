import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  hashMarketplaceState,
  parseMarketplaceCookie,
  YCLIENTS_MARKETPLACE_COOKIE,
} from "@/features/crm-connections/marketplace/yclients-state";
import { getPublicEnvironment } from "@/lib/env/public";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const maximumPostgresBigint = BigInt("9223372036854775807");
const salonIdSchema = z
  .string()
  .regex(/^[1-9][0-9]{0,18}$/)
  .refine((value) => BigInt(value) <= maximumPostgresBigint);

const completionRowsSchema = z.array(
  z.object({
    connection_id: z.uuid(),
    organization_id: z.uuid(),
  }),
);

function internalUrl(path: string): URL {
  return new URL(path, getPublicEnvironment().appUrl);
}

function responseWithoutState(url: URL): NextResponse {
  const response = NextResponse.redirect(url);
  response.cookies.delete(YCLIENTS_MARKETPLACE_COOKIE);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const marketplaceCookie = parseMarketplaceCookie(
    request.cookies.get(YCLIENTS_MARKETPLACE_COOKIE)?.value,
  );
  const salonIds = request.nextUrl.searchParams.getAll("salon_id");
  const salonId = salonIdSchema.safeParse(
    salonIds.length === 1 ? salonIds[0] : null,
  );

  if (!marketplaceCookie || !salonId.success) {
    const fallback = marketplaceCookie
      ? `/app/organizations/${marketplaceCookie.organizationId}/integrations/crm/${marketplaceCookie.connectionId}?yclients=failed`
      : "/app?yclients=failed";
    return responseWithoutState(internalUrl(fallback));
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    return responseWithoutState(internalUrl("/auth/sign-in"));
  }

  const { data, error } = await supabase.rpc(
    "complete_yclients_marketplace_attempt",
    {
      p_attempt_id: marketplaceCookie.attemptId,
      p_connection_id: marketplaceCookie.connectionId,
      p_organization_id: marketplaceCookie.organizationId,
      p_salon_id: salonId.data,
      p_state_hash: hashMarketplaceState(marketplaceCookie.state),
    },
  );
  const completed = completionRowsSchema.safeParse(data);

  if (error || !completed.success || completed.data.length !== 1) {
    return responseWithoutState(
      internalUrl(
        `/app/organizations/${marketplaceCookie.organizationId}/integrations/crm/${marketplaceCookie.connectionId}?yclients=failed`,
      ),
    );
  }

  const result = completed.data[0];
  return responseWithoutState(
    internalUrl(
      `/app/organizations/${result.organization_id}/integrations/crm/${result.connection_id}?yclients=activation-required`,
    ),
  );
}
