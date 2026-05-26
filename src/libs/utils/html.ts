const NAMED_ENTITIES: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
};

export function stripHtml(input: unknown): string {
  if (input == null) return '';
  const str = typeof input === 'string' ? input : String(input);
  return str
    .replace(/<[^>]*>/g, '')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&(nbsp|amp|lt|gt|quot|apos|#39);/g, (m) => NAMED_ENTITIES[m] ?? m)
    .replace(/\s+/g, ' ')
    .trim();
}
