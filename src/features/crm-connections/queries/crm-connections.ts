import "server-only";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

import type {
  CrmConnection,
  CrmConnectionConfiguration,
} from "../types";

const databaseConfigurationSchema = z
  .object({
    company_id: z.string().optional(),
    region: z.enum(["global", "eu", "us", "apac"]).optional(),
    workspace_reference: z.string().optional(),
  })
  .strict();

const crmConnectionRowSchema = z.object({
  configuration: databaseConfigurationSchema,
  created_at: z.string(),
  display_name: z.string(),
  id: z.uuid(),
  last_sync_at: z.string().nullable(),
  organization_id: z.uuid(),
  provider: z.enum(["custom", "yclients"]),
  status: z.enum(["draft", "connected", "disconnected", "error"]),
  updated_at: z.string(),
});

const crmConnectionRowsSchema = z.array(crmConnectionRowSchema);
const credentialStatusRowsSchema = z.array(
  z.object({
    credentials_saved: z.boolean(),
    credentials_updated_at: z.string().nullable(),
  }),
);

function mapConfiguration(
  configuration: z.infer<typeof databaseConfigurationSchema>,
): CrmConnectionConfiguration {
  return {
    ...(configuration.company_id
      ? { companyId: configuration.company_id }
      : {}),
    ...(configuration.region ? { region: configuration.region } : {}),
    ...(configuration.workspace_reference
      ? { workspaceReference: configuration.workspace_reference }
      : {}),
  };
}

function mapCrmConnection(
  row: z.infer<typeof crmConnectionRowSchema>,
): CrmConnection {
  return {
    configuration: mapConfiguration(row.configuration),
    createdAt: row.created_at,
    displayName: row.display_name,
    id: row.id,
    lastSyncAt: row.last_sync_at,
    organizationId: row.organization_id,
    provider: row.provider,
    status: row.status,
    updatedAt: row.updated_at,
  };
}

async function getAuthenticatedClient() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (!user || error) {
    return null;
  }

  return supabase;
}

export async function listCrmConnections(
  organizationId: string,
): Promise<CrmConnection[]> {
  const supabase = await getAuthenticatedClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("crm_connections")
    .select(
      "id, organization_id, provider, display_name, status, configuration, created_at, updated_at, last_sync_at",
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  const parsedRows = crmConnectionRowsSchema.safeParse(data);

  if (!parsedRows.success) {
    return [];
  }

  return parsedRows.data.map(mapCrmConnection);
}

export async function getCrmConnection(
  organizationId: string,
  connectionId: string,
): Promise<CrmConnection | null> {
  const supabase = await getAuthenticatedClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("crm_connections")
    .select(
      "id, organization_id, provider, display_name, status, configuration, created_at, updated_at, last_sync_at",
    )
    .eq("organization_id", organizationId)
    .eq("id", connectionId)
    .maybeSingle();

  if (!data || error) {
    return null;
  }

  const parsedRow = crmConnectionRowSchema.safeParse(data);
  return parsedRow.success ? mapCrmConnection(parsedRow.data) : null;
}

export async function getCrmConnectionCredentialStatus(
  organizationId: string,
  connectionId: string,
): Promise<{
  credentialsSaved: boolean;
  credentialsUpdatedAt: string | null;
} | null> {
  const supabase = await getAuthenticatedClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.rpc(
    "get_crm_connection_credential_status",
    {
      p_connection_id: connectionId,
      p_organization_id: organizationId,
    },
  );

  if (error) {
    return null;
  }

  const parsedRows = credentialStatusRowsSchema.safeParse(data);

  if (!parsedRows.success || parsedRows.data.length !== 1) {
    return null;
  }

  return {
    credentialsSaved: parsedRows.data[0].credentials_saved,
    credentialsUpdatedAt:
      parsedRows.data[0].credentials_updated_at,
  };
}
