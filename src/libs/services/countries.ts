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

// Unwraps the countries master into a plain array — the endpoint has been seen
// returning both a bare list and a paginated/wrapped object.
export function countryListFrom(payload: any): any[] {
  return Array.isArray(payload)
    ? payload
    : (payload?.results ?? payload?.data ?? payload?.countries ?? []);
}

// The country to submit with a form: detected via GET /v1/get_country/, then
// matched against the countries master (by id, then ISO code, then name) so the
// id we send is a catalogue id the backend accepts. Returns null when the
// country can't be determined; the caller decides whether that's fatal.
export async function resolveDetectedCountry(): Promise<{
  id: number;
  name: string;
} | null> {
  const detectedRes: any = await getCountryService();
  const detected = normalizeUserCountry(detectedRes?.data);
  if (!detected) return null;

  const norm = (v: any) => String(v ?? "").trim().toLowerCase();
  let match: any = null;
  try {
    const list = countryListFrom((await getCountriesService())?.data);
    match =
      list.find((c: any) => String(c?.id) === String(detected.id)) ??
      (detected.isoCode2
        ? list.find(
            (c: any) => norm(c?.iso_code_2 ?? c?.iso_code) === norm(detected.isoCode2),
          )
        : undefined) ??
      list.find(
        (c: any) => norm(c?.name ?? c?.country_name ?? c?.label) === norm(detected.name),
      ) ??
      null;
  } catch {
    // Catalogue lookup is best-effort — fall back to the detected id below.
  }

  const id = Number(match?.id ?? detected.id);
  if (!Number.isFinite(id)) return null;
  return { id, name: match?.name ?? match?.country_name ?? detected.name };
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