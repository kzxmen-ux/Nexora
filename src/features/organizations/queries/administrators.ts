import "server-only";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

import type { AdministratorManagementData } from "../invitations/types";

const administratorRowsSchema = z.array(
  z.object({
    administrator_created_at: z.string(),
    administrator_email: z.string(),
    administrator_user_id: z.uuid(),
  }),
);

const invitationRowsSchema = z.array(
  z.object({
    invitation_created_at: z.string(),
    invitation_email: z.string(),
    invitation_expires_at: z.string(),
    invitation_id: z.uuid(),
    invitation_status: z.enum(["accepted", "expired", "pending", "revoked"]),
  }),
);

export async function getAdministratorManagementData(
  organizationId: string,
): Promise<AdministratorManagementData> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    return { administrators: [], invitations: [], loadError: true };
  }

  const [administratorResult, invitationResult] = await Promise.all([
    supabase.rpc("list_organization_administrators", {
      p_organization_id: organizationId,
    }),
    supabase.rpc("list_organization_invitations", {
      p_organization_id: organizationId,
    }),
  ]);

  if (administratorResult.error || invitationResult.error) {
    return { administrators: [], invitations: [], loadError: true };
  }

  const administrators = administratorRowsSchema.safeParse(
    administratorResult.data,
  );
  const invitations = invitationRowsSchema.safeParse(invitationResult.data);

  if (!administrators.success || !invitations.success) {
    return { administrators: [], invitations: [], loadError: true };
  }

  return {
    administrators: administrators.data.map((administrator) => ({
      createdAt: administrator.administrator_created_at,
      email: administrator.administrator_email,
      userId: administrator.administrator_user_id,
    })),
    invitations: invitations.data.map((invitation) => ({
      createdAt: invitation.invitation_created_at,
      email: invitation.invitation_email,
      expiresAt: invitation.invitation_expires_at,
      id: invitation.invitation_id,
      status: invitation.invitation_status,
    })),
    loadError: false,
  };
}
