const MAXIMUM_SAFE_INTEGER = BigInt(Number.MAX_SAFE_INTEGER);
const MAXIMUM_LOCATION_COUNT = 100;
const POSITIVE_INTEGER_PATTERN = /^[1-9][0-9]{0,18}$/;

export type AltegioCallbackValidation =
  | { locationIds: string[]; success: true }
  | { success: false };

type AltegioCallbackInput = {
  salonId?: string | string[];
  salonIds?: string | string[];
};

function asArray(value: string | string[] | undefined): string[] {
  if (value === undefined) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

export function validateAltegioCallbackIds(
  input: AltegioCallbackInput,
): AltegioCallbackValidation {
  const singleIds = asArray(input.salonId);
  const multipleIds = asArray(input.salonIds);

  if (
    (singleIds.length > 0 && multipleIds.length > 0) ||
    singleIds.length > 1
  ) {
    return { success: false };
  }

  const locationIds = singleIds.length === 1 ? singleIds : multipleIds;

  if (
    locationIds.length === 0 ||
    locationIds.length > MAXIMUM_LOCATION_COUNT ||
    locationIds.some(
      (value) =>
        !POSITIVE_INTEGER_PATTERN.test(value) ||
        BigInt(value) > MAXIMUM_SAFE_INTEGER,
    )
  ) {
    return { success: false };
  }

  return {
    locationIds: [...new Set(locationIds)],
    success: true,
  };
}

export function getCanonicalAltegioCallbackPath(
  input: AltegioCallbackInput,
): string | null {
  const validation = validateAltegioCallbackIds(input);

  if (!validation.success) {
    return null;
  }

  const params = new URLSearchParams();

  if (validation.locationIds.length === 1) {
    params.set("salon_id", validation.locationIds[0]);
  } else {
    for (const locationId of validation.locationIds) {
      params.append("salon_ids[]", locationId);
    }
  }

  return `/integrations/altegio/callback?${params.toString()}`;
}
