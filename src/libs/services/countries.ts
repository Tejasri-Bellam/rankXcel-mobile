import { genericGet } from "./genericService";

// The countries master returns each flag as a raw SVG string. expo-image can
// only render SVG from a base64 data URI, so convert the markup into one.
// Idempotent: values that are already a data:/http URL pass through unchanged,
// so it's safe to run over persisted region.flagUrl values too. Returns
// undefined for empty/non-SVG input (callers fall back to the globe glyph).
export function svgToDataUri(flag?: string): string | undefined {
  const s = flag?.trim();
  if (!s) return undefined;
  if (s.startsWith("data:") || s.startsWith("http")) return s;
  if (!s.startsWith("<svg")) return undefined;
  try {
    // UTF-8-safe base64 (flags are ASCII, but this keeps any glyphs intact).
    const bytes = encodeURIComponent(s).replace(/%([0-9A-F]{2})/g, (_, h) =>
      String.fromCharCode(parseInt(h, 16))
    );
    return `data:image/svg+xml;base64,${btoa(bytes)}`;
  } catch {
    return undefined;
  }
}

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