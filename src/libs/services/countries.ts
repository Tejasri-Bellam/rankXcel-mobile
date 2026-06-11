import { genericGet } from "./genericService";

export async function getCountriesService() {
  return await genericGet(
    "/v1/masters/options/countries/",
    true
  );
}

// GET /api/v1/get_country/ — the logged-in user's country. The login response
// doesn't carry the country, so this is the authoritative source.
// Response: { country: { id, name, iso_code_2, iso_code_3 } }
export async function getCountryService() {
  return await genericGet("/v1/get_country/", true);
}

// Normalizes the get_country payload (the wrapped { country: {...} } shape, or
// a bare country object) into the fields the app uses.
export function normalizeUserCountry(
  payload: any
): { id: number | string; name: string; isoCode2?: string } | null {
  const c = payload?.country ?? payload;
  if (c?.id == null) return null;
  return {
    id: c.id,
    name: c.name ?? c.country_name ?? c.label ?? "",
    isoCode2: c.iso_code_2 ?? c.iso_code ?? undefined,
  };
}