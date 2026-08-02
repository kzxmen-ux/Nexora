"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  ALTEGIO_MARKETPLACE_ORGANIZATION_COOKIE,
  ALTEGIO_MARKETPLACE_ORGANIZATION_TTL_SECONDS,
  ALTEGIO_MARKETPLACE_URL,
  createAltegioMarketplaceState,
  hashAltegioMarketplaceState,
  serializeAltegioMarketplaceCookie,
  parseAltegioMarketplaceCookie,
} from "@/features/crm-connections/marketplace/altegio";
import { runAltegioActivation } from "@/features/crm-connections/providers/altegio/activation.server";
import type { CrmConnectionActionState } from "@/features/crm-connections/types";
import { formValue } from "@/features/crm-connections/validation/crm-connection";
import { organizationIdSchema } from "@/features/organizations/validation/organization";
import { createClient } from "@/lib/supabase/server";

const attemptRowsSchema = z.array(
  z.object({ attempt_id: z.uuid(), expires_at: z.string() }),
);

function marketplaceError(message: string): CrmConnectionActionState {
  return { message, status: "error" };
}

export async function startAltegioMarketplaceConnectionAction(
  _previousState: CrmConnectionActionState,
  formData: FormData,
): Promise<CrmConnectionActionState> {
  const organizationId = organizationIdSchema.safeParse(
    formValue(formData, "organizationId"),
  );

  if (!organizationId.success) {
    return marketplaceError("The Altegio connection request is invalid.");
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

  const state = createAltegioMarketplaceState();
  const { data, error } = await supabase.rpc(
    "create_altegio_marketplace_attempt",
    {
      p_organization_id: organizationId.data,
      p_state_hash: hashAltegioMarketplaceState(state),
    },
  );
  const attempt = attemptRowsSchema.safeParse(data);

  if (error || !attempt.success || attempt.data.length !== 1) {
    return marketplaceError(
      "The Altegio connection could not be started. Check organization access and try again.",
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(
    ALTEGIO_MARKETPLACE_ORGANIZATION_COOKIE,
    serializeAltegioMarketplaceCookie({
      attemptId: attempt.data[0].attempt_id,
      organizationId: organizationId.data,
      state,
    }),
    {
      httpOnly: true,
      maxAge: ALTEGIO_MARKETPLACE_ORGANIZATION_TTL_SECONDS,
      path: "/integrations/altegio/callback",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  );

  redirect(ALTEGIO_MARKETPLACE_URL);
}

export async function retryAltegioMarketplaceActivationAction(): Promise<void> {
  const cookieStore = await cookies();
  const context = parseAltegioMarketplaceCookie(
    cookieStore.get(ALTEGIO_MARKETPLACE_ORGANIZATION_COOKIE)?.value,
  );

  if (!context) {
    redirect("/integrations/altegio/callback?resume=1");
  }

  await runAltegioActivation({
    attemptId: context.attemptId,
    mode: "retry",
    organizationId: context.organizationId,
    stateHash: hashAltegioMarketplaceState(context.state),
  });

  redirect("/integrations/altegio/callback?resume=1");
}
