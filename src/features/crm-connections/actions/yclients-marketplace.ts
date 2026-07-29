"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { organizationIdSchema } from "@/features/organizations/validation/organization";
import { createClient } from "@/lib/supabase/server";

import {
  createMarketplaceState,
  hashMarketplaceState,
  serializeMarketplaceCookie,
  YCLIENTS_MARKETPLACE_COOKIE,
  YCLIENTS_MARKETPLACE_TTL_SECONDS,
  YCLIENTS_MARKETPLACE_URL,
} from "../marketplace/yclients-state";
import type { CrmConnectionActionState } from "../types";
import { formValue } from "../validation/crm-connection";

const attemptRowsSchema = z.array(
  z.object({
    attempt_id: z.uuid(),
    connection_id: z.uuid(),
    expires_at: z.string(),
  }),
);

function marketplaceError(message: string): CrmConnectionActionState {
  return { message, status: "error" };
}

export async function startYclientsMarketplaceConnectionAction(
  _previousState: CrmConnectionActionState,
  formData: FormData,
): Promise<CrmConnectionActionState> {
  const organizationId = organizationIdSchema.safeParse(
    formValue(formData, "organizationId"),
  );

  if (!organizationId.success) {
    return marketplaceError("The YCLIENTS connection request is invalid.");
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    return marketplaceError(
      "Your session has expired. Sign in and try again.",
    );
  }

  const state = createMarketplaceState();
  const { data, error } = await supabase.rpc(
    "create_yclients_marketplace_attempt",
    {
      p_organization_id: organizationId.data,
      p_state_hash: hashMarketplaceState(state),
    },
  );
  const attempts = attemptRowsSchema.safeParse(data);

  if (error || !attempts.success || attempts.data.length !== 1) {
    return marketplaceError(
      "The YCLIENTS connection could not be started. Check organization access and try again.",
    );
  }

  const attempt = attempts.data[0];
  const cookieStore = await cookies();
  cookieStore.set(
    YCLIENTS_MARKETPLACE_COOKIE,
    serializeMarketplaceCookie({
      attemptId: attempt.attempt_id,
      connectionId: attempt.connection_id,
      organizationId: organizationId.data,
      state,
    }),
    {
      httpOnly: true,
      maxAge: YCLIENTS_MARKETPLACE_TTL_SECONDS,
      path: "/integrations/yclients/callback",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  );

  redirect(YCLIENTS_MARKETPLACE_URL);
}
