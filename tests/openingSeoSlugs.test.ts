import {
  explorerOpeningSlug,
  legacyExplorerOpeningSlug,
  matchesExplorerOpeningSlug,
} from '../src/lib/openingSeoSlugs';

describe('explorerOpeningSlug', () => {
  it('keeps trailing Variation in the SEO slug', () => {
    expect(explorerOpeningSlug('Sicilian Defense: Najdorf Variation')).toBe(
      'sicilian-defense-najdorf-variation',
    );
  });

  it('matches both canonical and legacy stripped slugs', () => {
    const opening = 'Sicilian Defense: Najdorf Variation';
    expect(legacyExplorerOpeningSlug(opening)).toBe('sicilian-defense-najdorf');
    expect(matchesExplorerOpeningSlug(opening, 'sicilian-defense-najdorf-variation')).toBe(
      true,
    );
    expect(matchesExplorerOpeningSlug(opening, 'sicilian-defense-najdorf')).toBe(
      true,
    );
    expect(matchesExplorerOpeningSlug(opening, 'sicilian-defense-dragon')).toBe(
      false,
    );
  });
});
