"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  ALTEGIO_MARKETPLACE_ORGANIZATION_COOKIE,
  ALTEGIO_MARKETPLACE_ORGANIZATION_TTL_SECONDS,
  ALTEGIO_MARKETPLACE_URL,
} from "@/features/crm-connections/marketplace/altegio";
import type { CrmConnectionActionState } from "@/features/crm-connections/types";
import { formValue } from "@/features/crm-connections/validation/crm-connection";
import { organizationIdSchema } from "@/features/organizations/validation/organization";
import { createClient } from "@/lib/supabase/server";

const membershipSchema = z.object({
  role: z.enum(["owner", "admin"]),
});

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

  const { data, error } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", organizationId.data)
    .eq("user_id", user.id)
    .in("role", ["owner", "admin"])
    .maybeSingle();
  const membership = membershipSchema.safeParse(data);

  if (error || !membership.success) {
    return marketplaceError(
      "The Altegio connection could not be started. Check organization access and try again.",
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(
    ALTEGIO_MARKETPLACE_ORGANIZATION_COOKIE,
    organizationId.data,
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
