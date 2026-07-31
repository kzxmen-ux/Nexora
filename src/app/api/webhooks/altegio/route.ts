import { handleAltegioWebhook } from "@/features/webhooks/altegio/handler";
import { storeAltegioWebhookEvent } from "@/features/webhooks/altegio/repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  return handleAltegioWebhook(request, {
    storeEvent: storeAltegioWebhookEvent,
  });
}
