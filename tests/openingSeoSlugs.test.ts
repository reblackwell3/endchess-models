import {
  explorerOpeningSlug,
  legacyBrokenDiacriticFamilySlug,
  legacyBrokenDiacriticOpeningSlug,
  legacyExplorerOpeningSlug,
  matchesExplorerOpeningSlug,
  openingFamilySlug,
  slugifyOpeningName,
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

describe('slugifyOpeningName diacritics', () => {
  it('folds umlauts to ASCII letters', () => {
    expect(slugifyOpeningName('Grünfeld')).toBe('grunfeld');
    expect(slugifyOpeningName('Grünfeld Defense')).toBe('grunfeld-defense');
    expect(slugifyOpeningName('Neo-Grünfeld Defense')).toBe(
      'neo-grunfeld-defense',
    );
    expect(slugifyOpeningName('Düsseldorf')).toBe('dusseldorf');
    expect(slugifyOpeningName('Sämisch')).toBe('samisch');
    expect(slugifyOpeningName('Straße')).toBe('strasse');
  });

  it('produces ASCII family / explorer slugs for umlaut names', () => {
    expect(openingFamilySlug('Grünfeld Defense')).toBe('grunfeld-defense');
    expect(
      explorerOpeningSlug('Van Geet Opening: Düsseldorf Gambit'),
    ).toBe('van-geet-opening-dusseldorf-gambit');
  });

  it('keeps legacy broken diacritic slugs for indexed URLs', () => {
    expect(legacyBrokenDiacriticFamilySlug('Grünfeld Defense')).toBe(
      'gr-nfeld-defense',
    );
    expect(
      legacyBrokenDiacriticOpeningSlug(
        'Van Geet Opening: Düsseldorf Gambit',
      ),
    ).toBe('van-geet-opening-d-sseldorf-gambit');
    expect(
      legacyBrokenDiacriticOpeningSlug('Neo-Grünfeld Defense'),
    ).toBe('neo-gr-nfeld-defense');
  });

  it('matches both ASCII and legacy broken explorer slugs', () => {
    const grunfeld = 'Neo-Grünfeld Defense';
    expect(matchesExplorerOpeningSlug(grunfeld, 'neo-grunfeld-defense')).toBe(
      true,
    );
    expect(matchesExplorerOpeningSlug(grunfeld, 'neo-gr-nfeld-defense')).toBe(
      true,
    );

    const dusseldorf = 'Van Geet Opening: Düsseldorf Gambit';
    expect(
      matchesExplorerOpeningSlug(dusseldorf, 'van-geet-opening-dusseldorf-gambit'),
    ).toBe(true);
    expect(
      matchesExplorerOpeningSlug(
        dusseldorf,
        'van-geet-opening-d-sseldorf-gambit',
      ),
    ).toBe(true);
  });
});
