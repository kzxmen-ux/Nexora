import "server-only";

import { cookies } from "next/headers";

import {
  DEFAULT_LOCALE,
  isLocale,
  LOCALE_COOKIE_NAME,
  type Locale,
  translate,
} from "./config";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE_NAME)?.value;

  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export async function getTranslator(): Promise<(key: string) => string> {
  const locale = await getLocale();

  return (key: string) => translate(locale, key);
}
