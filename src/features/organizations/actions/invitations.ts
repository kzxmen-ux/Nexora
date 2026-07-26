"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getPublicEnvironment } from "@/lib/env/public";
import { createClient } from "@/lib/supabase/server";

import type { InvitationActionState } from "../invitations/types";
import {
  createInvitationSchema,
  invitationTokenSchema,
  removeAdministratorSchema,
  revokeInvitationSchema,
} from "../validation/invitation";
import { formValue } from "../validation/organization";

const createdInvitationRowsSchema = z.array(
  z.object({
    invitation_expires_at: z.string(),
    invitation_id: z.uuid(),
    invitation_token: z.string(),
  }),
);

function validationError(
  fieldErrors: InvitationActionState["fieldErrors"],
): InvitationActionState {
  return {
    fieldErrors,
    message: "Check the highlighted fields.",
    status: "error",
  };
}

function serviceError(message: string): InvitationActionState {
  return { message, status: "error" };
}

async function requireAuthenticatedClient() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return { authenticated: Boolean(user) && !error, supabase };
}

export async function createInvitationAction(
  _previousState: InvitationActionState,
  formData: FormData,
): Promise<InvitationActionState> {
  const validation = createInvitationSchema.safeParse({
    email: formValue(formData, "email"),
    organizationId: formValue(formData, "organizationId"),
  });

  if (!validation.success) {
    return validationError(validation.error.flatten().fieldErrors);
  }

  const { authenticated, supabase } = await requireAuthenticatedClient();

  if (!authenticated) {
    return serviceError("Your session has expired. Sign in and try again.");
  }

  const { data, error } = await supabase.rpc(
    "create_organization_invitation",
    {
      p_email: validation.data.email,
      p_organization_id: validation.data.organizationId,
    },
  );
  const invitationResult = createdInvitationRowsSchema.safeParse(data);
  const invitation = invitationResult.success
    ? invitationResult.data[0]
    : undefined;

  if (error || !invitation) {
    if (error?.code === "23505") {
      return validationError({
        email: [
          "An active invitation already exists, or this user is already a member.",
        ],
      });
    }

    return serviceError(
      "The invitation could not be created. Check owner access and try again.",
    );
  }

  const { appUrl } = getPublicEnvironment();
  const invitationUrl = new URL("/invitations/accept", appUrl);
  invitationUrl.searchParams.set("token", invitation.invitation_token);

  revalidatePath(
    `/app/organizations/${validation.data.organizationId}/administrators`,
  );

  return {
    invitationLink: invitationUrl.toString(),
    message:
      "Invitation created. Copy this link now; it cannot be shown again.",
    status: "success",
  };
}

export async function revokeInvitationAction(
  _previousState: InvitationActionState,
  formData: FormData,
): Promise<InvitationActionState> {
  const validation = revokeInvitationSchema.safeParse({
    invitationId: formValue(formData, "invitationId"),
    organizationId: formValue(formData, "organizationId"),
  });

  if (!validation.success) {
    return serviceError("The invitation request is invalid.");
  }

  const { authenticated, supabase } = await requireAuthenticatedClient();

  if (!authenticated) {
    return serviceError("Your session has expired. Sign in and try again.");
  }

  const { error } = await supabase.rpc("revoke_organization_invitation", {
    p_invitation_id: validation.data.invitationId,
  });

  if (error) {
    return serviceError(
      "The invitation could not be revoked. It may no longer be pending.",
    );
  }

  revalidatePath(
    `/app/organizations/${validation.data.organizationId}/administrators`,
  );

  return { message: "Invitation revoked.", status: "success" };
}

export async function removeAdministratorAction(
  _previousState: InvitationActionState,
  formData: FormData,
): Promise<InvitationActionState> {
  const validation = removeAdministratorSchema.safeParse({
    organizationId: formValue(formData, "organizationId"),
    userId: formValue(formData, "userId"),
  });

  if (!validation.success) {
    return serviceError("The administrator request is invalid.");
  }

  const { authenticated, supabase } = await requireAuthenticatedClient();

  if (!authenticated) {
    return serviceError("Your session has expired. Sign in and try again.");
  }

  const { error } = await supabase.rpc("remove_organization_admin", {
    organization_id: validation.data.organizationId,
    user_id: validation.data.userId,
  });

  if (error) {
    return serviceError(
      "The administrator could not be removed. Check owner access and try again.",
    );
  }

  revalidatePath(
    `/app/organizations/${validation.data.organizationId}/administrators`,
  );
  revalidatePath(`/app/organizations/${validation.data.organizationId}`);

  return { message: "Administrator removed.", status: "success" };
}

export async function acceptInvitationAction(
  _previousState: InvitationActionState,
  formData: FormData,
): Promise<InvitationActionState> {
  const validation = invitationTokenSchema.safeParse(
    formValue(formData, "token"),
  );

  if (!validation.success) {
    return validationError({ token: ["Invitation link is invalid."] });
  }

  const { authenticated, supabase } = await requireAuthenticatedClient();

  if (!authenticated) {
    return serviceError("Sign in or create an account before accepting.");
  }

  const { data, error } = await supabase.rpc(
    "accept_organization_invitation",
    {
      p_token: validation.data,
    },
  );

  if (error || typeof data !== "string") {
    return serviceError(
      "This invitation is invalid, expired, revoked, already used, or belongs to another email.",
    );
  }

  revalidatePath("/app");
  redirect(`/app/organizations/${data}?invitation=accepted`);
}
