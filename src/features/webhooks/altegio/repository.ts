import "server-only";

import { z } from "zod";

import { createPrivilegedClient } from "@/lib/supabase/privileged";

import type { AltegioWebhookStoreResult } from "./handler";
import type { AltegioWebhookPayload } from "./validation";

const storeResultRowsSchema = z.array(
  z.object({
    event_id: z.uuid().nullable(),
    outcome: z.enum([
      "accepted",
      "connection_unavailable",
      "duplicate",
    ]),
  }),
);

export async function storeAltegioWebhookEvent(
  payload: AltegioWebhookPayload,
): Promise<AltegioWebhookStoreResult> {
  const supabase = createPrivilegedClient();
  const { data, error } = await supabase.rpc(
    "store_altegio_webhook_event",
    {
      p_company_id: payload.company_id,
      p_event_status: payload.status,
      p_payload: payload,
      p_resource: payload.resource,
      p_resource_id: payload.resource_id,
    },
  );

  if (error) {
    throw new Error("Altegio webhook storage failed.");
  }

  const rows = storeResultRowsSchema.safeParse(data);

  if (!rows.success || rows.data.length !== 1) {
    throw new Error("Altegio webhook storage failed.");
  }

  const result = rows.data[0];

  if (result.outcome === "connection_unavailable") {
    return { eventId: null, outcome: result.outcome };
  }

  if (!result.event_id) {
    throw new Error("Altegio webhook storage failed.");
  }

  return { eventId: result.event_id, outcome: result.outcome };
}
