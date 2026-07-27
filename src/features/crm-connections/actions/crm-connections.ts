"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  encryptCredentialPayload,
  type EncryptedCredentialEnvelope,
} from "@/lib/security/encryption";

import { getBookingProvider } from "../providers/booking-provider-registry";
import type { CrmConnectionActionState } from "../types";
import {
  buildCrmConfiguration,
  createCrmConnectionSchema,
  createYclientsConnectionSchema,
  crmConnectionTargetSchema,
  formValue,
  updateCrmConnectionSchema,
  updateYclientsConnectionSchema,
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

function yclientsConnectionValues(formData: FormData) {
  return {
    companyId: formValue(formData, "companyId"),
    displayName: formValue(formData, "displayName"),
    organizationId: formValue(formData, "organizationId"),
  };
}

function revalidateCrmConnection(
  organizationId: string,
  connectionId: string,
) {
  revalidatePath(
    `/app/organizations/${organizationId}/integrations/crm`,
  );
  revalidatePath(
    `/app/organizations/${organizationId}/integrations/crm/${connectionId}`,
  );
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

export async function createYclientsConnectionAction(
  _previousState: CrmConnectionActionState,
  formData: FormData,
): Promise<CrmConnectionActionState> {
  const validation = createYclientsConnectionSchema.safeParse(
    yclientsConnectionValues(formData),
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
      configuration: { company_id: validation.data.companyId },
      created_by: user.id,
      display_name: validation.data.displayName,
      id: connectionId,
      organization_id: validation.data.organizationId,
      provider: "yclients",
    })
    .select("id")
    .maybeSingle();

  if (!data || error) {
    return serviceError(
      "The YCLIENTS connection could not be created. Check organization access and try again.",
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

export async function updateYclientsConnectionAction(
  _previousState: CrmConnectionActionState,
  formData: FormData,
): Promise<CrmConnectionActionState> {
  const validation = updateYclientsConnectionSchema.safeParse({
    ...yclientsConnectionValues(formData),
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
      configuration: { company_id: validation.data.companyId },
      display_name: validation.data.displayName,
    })
    .eq("organization_id", validation.data.organizationId)
    .eq("id", validation.data.connectionId)
    .eq("provider", "yclients")
    .select("id")
    .maybeSingle();

  if (!data || error) {
    return serviceError(
      "The YCLIENTS connection could not be updated. Access may have been denied.",
    );
  }

  revalidateCrmConnection(
    validation.data.organizationId,
    validation.data.connectionId,
  );

  return { message: "Connection settings saved.", status: "success" };
}

export async function saveYclientsCredentialsAction(
  _previousState: CrmConnectionActionState,
  formData: FormData,
): Promise<CrmConnectionActionState> {
  const target = crmConnectionTargetSchema.safeParse({
    connectionId: formValue(formData, "connectionId"),
    organizationId: formValue(formData, "organizationId"),
  });
  const provider = getBookingProvider("yclients");
  const credentials = provider.validateCredentials({
    partnerToken: formValue(formData, "partnerToken"),
    userToken: formValue(formData, "userToken"),
  });

  if (!target.success || !credentials.success) {
    return validationError(
      credentials.success
        ? {}
        : {
            partnerToken: credentials.fieldErrors.partnerToken,
            userToken: credentials.fieldErrors.userToken,
          },
    );
  }

  const { supabase, user } = await requireAuthenticatedClient();

  if (!user) {
    return serviceError("Your session has expired. Sign in and try again.");
  }

  let envelope: EncryptedCredentialEnvelope;

  try {
    envelope = encryptCredentialPayload(credentials.data);
  } catch {
    return serviceError(
      "Credential encryption is not configured. Contact the administrator.",
    );
  }

  const { error } = await supabase.rpc("save_crm_connection_credentials", {
    p_authentication_tag: envelope.authenticationTag,
    p_connection_id: target.data.connectionId,
    p_encrypted_payload: envelope.encryptedPayload,
    p_initialization_vector: envelope.initializationVector,
    p_key_version: envelope.keyVersion,
    p_organization_id: target.data.organizationId,
  });

  if (error) {
    return serviceError(
      "Credentials could not be saved. Check organization access and try again.",
    );
  }

  revalidateCrmConnection(
    target.data.organizationId,
    target.data.connectionId,
  );

  return { message: "Credentials saved.", status: "success" };
}

export async function testYclientsConnectionAction(
  _previousState: CrmConnectionActionState,
  formData: FormData,
): Promise<CrmConnectionActionState> {
  const target = crmConnectionTargetSchema.safeParse({
    connectionId: formValue(formData, "connectionId"),
    organizationId: formValue(formData, "organizationId"),
  });

  if (!target.success) {
    return serviceError("The CRM connection request is invalid.");
  }

  const { supabase, user } = await requireAuthenticatedClient();

  if (!user) {
    return serviceError("Your session has expired. Sign in and try again.");
  }

  const { data, error } = await supabase.rpc(
    "get_crm_connection_credential_status",
    {
      p_connection_id: target.data.connectionId,
      p_organization_id: target.data.organizationId,
    },
  );

  if (error || !Array.isArray(data) || data.length !== 1) {
    return serviceError(
      "The connection could not be tested. Access may have been denied.",
    );
  }

  const result = getBookingProvider("yclients").testConnection({
    credentialsSaved: data[0]?.credentials_saved === true,
  });

  return result.status === "credentials_required"
    ? serviceError("Save YCLIENTS credentials before testing.")
    : serviceError(
        "Official YCLIENTS API access is required to test this connection.",
      );
}

export async function disconnectYclientsConnectionAction(
  _previousState: CrmConnectionActionState,
  formData: FormData,
): Promise<CrmConnectionActionState> {
  const target = crmConnectionTargetSchema.safeParse({
    connectionId: formValue(formData, "connectionId"),
    organizationId: formValue(formData, "organizationId"),
  });

  if (!target.success) {
    return serviceError("The CRM connection request is invalid.");
  }

  const { supabase, user } = await requireAuthenticatedClient();

  if (!user) {
    return serviceError("Your session has expired. Sign in and try again.");
  }

  const { error } = await supabase.rpc("delete_crm_connection_credentials", {
    p_connection_id: target.data.connectionId,
    p_organization_id: target.data.organizationId,
  });

  if (error) {
    return serviceError(
      "The connection could not be disconnected. Access may have been denied.",
    );
  }

  getBookingProvider("yclients").disconnect();
  revalidateCrmConnection(
    target.data.organizationId,
    target.data.connectionId,
  );

  return {
    message: "Credentials deleted and connection disconnected.",
    status: "success",
  };
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
