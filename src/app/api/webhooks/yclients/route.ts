import { handleYclientsWebhook } from "@/features/webhooks/yclients/handler";
import { storeYclientsWebhookEvent } from "@/features/webhooks/yclients/repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  return handleYclientsWebhook(request, {
    storeEvent: storeYclientsWebhookEvent,
  });
}
