/** Strip diacritics then hyphenate non-alphanumerics (ü→u, ö→o, ä→a, ß→ss). */
export function slugifyOpeningName(name: string): string {
  return name
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Prior slugify that treated diacritics as separators (Grünfeld → gr-nfeld).
 * Kept for resolving older indexed / bookmarked URLs.
 */
export function legacyBrokenDiacriticSlugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Family portion before the first colon. */
export function openingFamilyFromName(opening: string): string {
  const trimmed = opening.trim();
  const colonIndex = trimmed.indexOf(':');
  return colonIndex >= 0 ? trimmed.slice(0, colonIndex).trim() : trimmed;
}

/** Variation suffix after family, with trailing " Variation" removed. */
export function openingVariationSuffix(opening: string): string {
  const trimmed = opening.trim();
  const colonIndex = trimmed.indexOf(':');
  const suffix =
    colonIndex >= 0 ? trimmed.slice(colonIndex + 1).trim() : trimmed;
  return suffix.replace(/ Variation$/i, '').trim();
}

export function openingFamilySlug(opening: string): string {
  return slugifyOpeningName(openingFamilyFromName(opening));
}

export function openingVariationSlug(opening: string): string {
  return slugifyOpeningName(openingVariationSuffix(opening));
}

/** Explorer SEO slug — preserves trailing "Variation" in the name. */
export function explorerOpeningSlug(opening: string): string {
  return slugifyOpeningName(opening.trim());
}

/**
 * Prior explorer SEO slug that stripped trailing " Variation".
 * Kept for resolving older indexed / bookmarked URLs.
 */
export function legacyExplorerOpeningSlug(opening: string): string {
  return slugifyOpeningName(opening.replace(/ Variation$/i, '').trim());
}

/**
 * Prior explorer SEO slug that hyphenated diacritics (no NFD fold).
 * Kept for resolving older indexed / bookmarked URLs.
 */
export function legacyBrokenDiacriticOpeningSlug(opening: string): string {
  return legacyBrokenDiacriticSlugify(opening.trim());
}

/**
 * Prior family slug that hyphenated diacritics (Grünfeld Defense → gr-nfeld-defense).
 */
export function legacyBrokenDiacriticFamilySlug(opening: string): string {
  return legacyBrokenDiacriticSlugify(openingFamilyFromName(opening));
}

export function matchesExplorerOpeningSlug(
  opening: string,
  slug: string,
): boolean {
  const normalizedSlug = slug.trim().toLowerCase();
  return (
    explorerOpeningSlug(opening) === normalizedSlug ||
    legacyExplorerOpeningSlug(opening) === normalizedSlug ||
    legacyBrokenDiacriticOpeningSlug(opening) === normalizedSlug ||
    legacyBrokenDiacriticSlugify(
      opening.replace(/ Variation$/i, '').trim(),
    ) === normalizedSlug
  );
}

/** URL slug for corpus player browse pages (e.g. Carlsen,M → carlsen-m). */
export function playerBrowseSlug(username: string): string {
  return username
    .trim()
    .toLowerCase()
    .replace(/[,\s.]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
