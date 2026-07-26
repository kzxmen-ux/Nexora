"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import type { CrmConnectionActionState } from "../types";
import {
  buildCrmConfiguration,
  createCrmConnectionSchema,
  crmConnectionTargetSchema,
  formValue,
  updateCrmConnectionSchema,
} from "../validation/crm-connection";

function validationError(
  fieldErrors: CrmConnectionActionState["fieldErrors"],
): CrmConnectionActionState {
  return {
    fieldErrors,
    message: "Check the highlighted fields.",
    status: "error",
  };
}

function serviceError(message: string): CrmConnectionActionState {
  return { message, status: "error" };
}

async function requireAuthenticatedClient() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return { supabase, user: error ? null : user };
}

function connectionValues(formData: FormData) {
  return {
    displayName: formValue(formData, "displayName"),
    organizationId: formValue(formData, "organizationId"),
    region: formValue(formData, "region"),
    workspaceReference: formValue(formData, "workspaceReference"),
  };
}

export async function createCrmConnectionAction(
  _previousState: CrmConnectionActionState,
  formData: FormData,
): Promise<CrmConnectionActionState> {
  const validation = createCrmConnectionSchema.safeParse(
    connectionValues(formData),
  );

  if (!validation.success) {
    return validationError(validation.error.flatten().fieldErrors);
  }

  const { supabase, user } = await requireAuthenticatedClient();

  if (!user) {
    return serviceError("Your session has expired. Sign in and try again.");
  }

  const connectionId = crypto.randomUUID();
  const { data, error } = await supabase
    .from("crm_connections")
    .insert({
      configuration: buildCrmConfiguration(validation.data),
      created_by: user.id,
      display_name: validation.data.displayName,
      id: connectionId,
      organization_id: validation.data.organizationId,
      provider: "custom",
    })
    .select("id")
    .maybeSingle();

  if (!data || error) {
    return serviceError(
      "The CRM connection could not be created. Check organization access and try again.",
    );
  }

  redirect(
    `/app/organizations/${validation.data.organizationId}/integrations/crm/${connectionId}`,
  );
}

export async function updateCrmConnectionAction(
  _previousState: CrmConnectionActionState,
  formData: FormData,
): Promise<CrmConnectionActionState> {
  const validation = updateCrmConnectionSchema.safeParse({
    ...connectionValues(formData),
    connectionId: formValue(formData, "connectionId"),
  });

  if (!validation.success) {
    return validationError(validation.error.flatten().fieldErrors);
  }

  const { supabase, user } = await requireAuthenticatedClient();

  if (!user) {
    return serviceError("Your session has expired. Sign in and try again.");
  }

  const { data, error } = await supabase
    .from("crm_connections")
    .update({
      configuration: buildCrmConfiguration(validation.data),
      display_name: validation.data.displayName,
    })
    .eq("organization_id", validation.data.organizationId)
    .eq("id", validation.data.connectionId)
    .select("id")
    .maybeSingle();

  if (!data || error) {
    return serviceError(
      "The CRM connection could not be updated. Access may have been denied.",
    );
  }

  const connectionPath = `/app/organizations/${validation.data.organizationId}/integrations/crm/${validation.data.connectionId}`;
  revalidatePath(connectionPath);
  revalidatePath(
    `/app/organizations/${validation.data.organizationId}/integrations/crm`,
  );

  return { message: "Connection settings saved.", status: "success" };
}

async function setCrmConnectionStatus(
  formData: FormData,
  status: "disconnected" | "draft",
): Promise<CrmConnectionActionState> {
  const validation = crmConnectionTargetSchema.safeParse({
    connectionId: formValue(formData, "connectionId"),
    organizationId: formValue(formData, "organizationId"),
  });

  if (!validation.success) {
    return serviceError("The CRM connection request is invalid.");
  }

  const { supabase, user } = await requireAuthenticatedClient();

  if (!user) {
    return serviceError("Your session has expired. Sign in and try again.");
  }

  const { error } = await supabase.rpc("set_crm_connection_status", {
    p_connection_id: validation.data.connectionId,
    p_organization_id: validation.data.organizationId,
    p_status: status,
  });

  if (error) {
    return serviceError(
      "The CRM connection status could not be changed. Access may have been denied.",
    );
  }

  revalidatePath(
    `/app/organizations/${validation.data.organizationId}/integrations/crm`,
  );
  revalidatePath(
    `/app/organizations/${validation.data.organizationId}/integrations/crm/${validation.data.connectionId}`,
  );

  return {
    message:
      status === "disconnected"
        ? "Connection marked as disconnected."
        : "Connection returned to draft.",
    status: "success",
  };
}

export async function disconnectCrmConnectionAction(
  _previousState: CrmConnectionActionState,
  formData: FormData,
): Promise<CrmConnectionActionState> {
  return setCrmConnectionStatus(formData, "disconnected");
}

export async function returnCrmConnectionToDraftAction(
  _previousState: CrmConnectionActionState,
  formData: FormData,
): Promise<CrmConnectionActionState> {
  return setCrmConnectionStatus(formData, "draft");
}

export async function deleteCrmConnectionAction(
  _previousState: CrmConnectionActionState,
  formData: FormData,
): Promise<CrmConnectionActionState> {
  const validation = crmConnectionTargetSchema.safeParse({
    connectionId: formValue(formData, "connectionId"),
    organizationId: formValue(formData, "organizationId"),
  });

  if (!validation.success) {
    return serviceError("The CRM connection request is invalid.");
  }

  const { supabase, user } = await requireAuthenticatedClient();

  if (!user) {
    return serviceError("Your session has expired. Sign in and try again.");
  }

  const { data, error } = await supabase
    .from("crm_connections")
    .delete()
    .eq("organization_id", validation.data.organizationId)
    .eq("id", validation.data.connectionId)
    .select("id")
    .maybeSingle();

  if (!data || error) {
    return serviceError(
      "The CRM connection could not be deleted. Access may have been denied.",
    );
  }

  redirect(
    `/app/organizations/${validation.data.organizationId}/integrations/crm?deleted=1`,
  );
}
