export const ALTEGIO_MARKETPLACE_ACTIVATION_URL =
  "https://app.alteg.io/marketplace/partner/callback";
export const ALTEGIO_API_V1_URL = "https://api.alteg.io/api/v1";
export const ALTEGIO_ACCEPT_HEADER = "application/vnd.api.v2+json";
export const ALTEGIO_REQUEST_TIMEOUT_MS = 8_000;

export type AltegioProviderErrorCode =
  | "configuration_error"
  | "forbidden"
  | "invalid_response"
  | "not_found"
  | "provider_unavailable"
  | "timeout"
  | "unauthorized"
  | "validation_error";

export type AltegioProviderResult =
  | { success: true }
  | { code: AltegioProviderErrorCode; retryable: boolean; success: false };

export type AltegioMarketplaceTransportOptions = {
  applicationId: number;
  fetchImplementation?: typeof fetch;
  partnerToken: string;
  timeoutMs?: number;
  userToken: string;
};

type SafeProviderBody = {
  data?: unknown;
  success?: unknown;
};

function mapStatus(status: number): AltegioProviderResult {
  switch (status) {
    case 401:
      return { code: "unauthorized", retryable: false, success: false };
    case 403:
      return { code: "forbidden", retryable: false, success: false };
    case 404:
      return { code: "not_found", retryable: false, success: false };
    case 400:
    case 422:
      return { code: "validation_error", retryable: false, success: false };
    default:
      return {
        code: "provider_unavailable",
        retryable: status >= 500,
        success: false,
      };
  }
}

async function readSafeBody(response: Response): Promise<SafeProviderBody | null> {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().includes("application/json")) {
    await response.text().catch(() => "");
    return null;
  }

  try {
    const parsed: unknown = await response.json();
    return typeof parsed === "object" && parsed !== null
      ? (parsed as SafeProviderBody)
      : null;
  } catch {
    return null;
  }
}

async function request(
  fetchImplementation: typeof fetch,
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response | AltegioProviderResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetchImplementation(url, {
      ...init,
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (error) {
    if (
      controller.signal.aborted ||
      (error instanceof Error && error.name === "AbortError")
    ) {
      return { code: "timeout", retryable: true, success: false };
    }

    return { code: "provider_unavailable", retryable: true, success: false };
  } finally {
    clearTimeout(timeout);
  }
}

export function createAltegioMarketplaceTransport(
  options: AltegioMarketplaceTransportOptions,
) {
  const fetchImplementation = options.fetchImplementation ?? fetch;
  const timeoutMs = options.timeoutMs ?? ALTEGIO_REQUEST_TIMEOUT_MS;

  return {
    async activateLocation(locationId: string): Promise<AltegioProviderResult> {
      const response = await request(
        fetchImplementation,
        ALTEGIO_MARKETPLACE_ACTIVATION_URL,
        {
          body: JSON.stringify({
            application_id: options.applicationId,
            salon_id: Number(locationId),
          }),
          headers: {
            Accept: ALTEGIO_ACCEPT_HEADER,
            Authorization: `Bearer ${options.partnerToken}`,
            "Content-Type": "application/json",
          },
          method: "POST",
        },
        timeoutMs,
      );

      if (!(response instanceof Response)) {
        return response;
      }

      await readSafeBody(response);
      return response.status === 201 ? { success: true } : mapStatus(response.status);
    },

    async verifyLocationAccess(
      locationId: string,
    ): Promise<AltegioProviderResult> {
      const response = await request(
        fetchImplementation,
        `${ALTEGIO_API_V1_URL}/company/${encodeURIComponent(locationId)}`,
        {
          headers: {
            Accept: ALTEGIO_ACCEPT_HEADER,
            Authorization: `Bearer ${options.partnerToken}, User ${options.userToken}`,
            "Content-Type": "application/json",
          },
          method: "GET",
        },
        timeoutMs,
      );

      if (!(response instanceof Response)) {
        return response;
      }

      const body = await readSafeBody(response);

      if (!response.ok) {
        return mapStatus(response.status);
      }

      if (
        body?.success !== true ||
        typeof body.data !== "object" ||
        body.data === null ||
        String((body.data as { id?: unknown }).id) !== locationId
      ) {
        return { code: "invalid_response", retryable: true, success: false };
      }

      return { success: true };
    },
  };
}

export type AltegioMarketplaceTransport = ReturnType<
  typeof createAltegioMarketplaceTransport
>;
