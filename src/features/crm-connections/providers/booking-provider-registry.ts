import "server-only";

import type { CrmProvider } from "../types";
import type { BookingProvider } from "./booking-provider";
import { AltegioProvider } from "./altegio/altegio-provider";
import { DevelopmentProvider } from "./development/development-provider";
import { YClientsProvider } from "./yclients/yclients-provider";

const bookingProviderRegistry: Record<CrmProvider, BookingProvider> = {
  altegio: new AltegioProvider(),
  custom: new DevelopmentProvider(),
  yclients: new YClientsProvider(),
};

export function getBookingProvider(type: CrmProvider): BookingProvider {
  return bookingProviderRegistry[type];
}
