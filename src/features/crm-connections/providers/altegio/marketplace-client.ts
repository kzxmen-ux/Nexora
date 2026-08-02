import "server-only";

import { getAltegioServerEnvironment } from "@/lib/env/server";

import { createAltegioMarketplaceTransport } from "./marketplace-transport";

export function createAltegioMarketplaceClient() {
  return createAltegioMarketplaceTransport(getAltegioServerEnvironment());
}
