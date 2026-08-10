/**
 * Strips combining marks so "Modric" matches "Modrić" and "Nunez" matches
 * "Núñez". `\p{M}` covers every combining mark class, which is why the input is
 * decomposed with NFD first.
 */
function stripDiacritics(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '');
}

/** Search key: letters and digits only, diacritics folded, lowercased. */
export function normalize(value: string): string {
  return stripDiacritics(value.toLowerCase()).replace(/[^a-z0-9]/g, '');
}

/** URL/id-safe slug with hyphen separators. */
export function slugify(value: string): string {
  return stripDiacritics(value.toLowerCase())
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Splits a display name into searchable word tokens (diacritics folded). */
export function tokens(value: string): string[] {
  return stripDiacritics(value.toLowerCase())
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}
