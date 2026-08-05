// Percentages are shown exactly as scored — never rounded to a whole number.
// The mock/assessment cards render the API's raw value (e.g. "38.89%"), so the
// results screens have to match it; rounding there made the same attempt read
// as 39% on one screen and 38.89% on another.
//
// Values are capped at two decimals to keep derived percentages (4/9 * 100 =
// 44.4444…) readable, and trailing zeros are dropped so 100.0 stays "100".

export function formatPercent(value: unknown, decimals = 2): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  const factor = 10 ** decimals;
  const rounded = Math.round(n * factor) / factor;
  // String() already drops trailing zeros (38.90 → "38.9", 100.00 → "100").
  return String(rounded);
}
