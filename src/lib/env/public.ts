type PublicEnvironment = {
  appUrl: string;
  supabasePublishableKey: string;
  supabaseUrl: string;
};

let cachedEnvironment: PublicEnvironment | undefined;

function requireValue(name: string, value: string | undefined): string {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    throw new Error(`Missing required public environment variable: ${name}.`);
  }

  return normalizedValue;
}

function requireHttpUrl(name: string, value: string | undefined): URL {
  const normalizedValue = requireValue(name, value);

  try {
    const url = new URL(normalizedValue);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("Unsupported URL protocol.");
    }

    return url;
  } catch {
    throw new Error(
      `Public environment variable ${name} must be a valid HTTP(S) URL.`,
    );
  }
}

export function getPublicEnvironment(): PublicEnvironment {
  if (cachedEnvironment) {
    return cachedEnvironment;
  }

  const supabaseUrl = requireHttpUrl(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  ).toString();
  const supabasePublishableKey = requireValue(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
  const appUrl = requireHttpUrl(
    "NEXT_PUBLIC_APP_URL",
    process.env.NEXT_PUBLIC_APP_URL,
  ).origin;

  cachedEnvironment = Object.freeze({
    appUrl,
    supabasePublishableKey,
    supabaseUrl,
  });

  return cachedEnvironment;
}
