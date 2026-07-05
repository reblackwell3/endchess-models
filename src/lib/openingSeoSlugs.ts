/** URL-safe slug for opening family / variation names (SEO browse + explorer). */
export function slugifyOpeningName(name: string): string {
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

export function explorerOpeningSlug(opening: string): string {
  return slugifyOpeningName(opening.replace(/ Variation$/i, '').trim());
}
