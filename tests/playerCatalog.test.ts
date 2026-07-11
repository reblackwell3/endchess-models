import { playerBrowseSlug } from '../src/lib/openingSeoSlugs';
import {
  playerNameKey,
  preferredDisplayUsername,
} from '../src/lib/playerNameUtils';
import { corpusPlayerRowFromAggregate } from '../src/lib/corpusPlayerCatalog';

describe('playerBrowseSlug', () => {
  it('derives browse slugs from TWIC and Lichess usernames', () => {
    expect(playerBrowseSlug('Carlsen,M')).toBe('carlsen-m');
    expect(playerBrowseSlug('Carlsen, Magnus')).toBe('carlsen-magnus');
    expect(playerBrowseSlug('Hikaru')).toBe('hikaru');
  });
});

describe('playerNameKey', () => {
  it('groups comma-name variants under the same key', () => {
    expect(playerNameKey('Carlsen,M')).toBe('carlsen,m');
    expect(playerNameKey('Carlsen, Magnus')).toBe('carlsen,m');
    expect(playerNameKey('Hikaru')).toBe('hikaru');
  });
});

describe('corpusPlayerRowFromAggregate', () => {
  it('stores slug aliases for all username spellings', () => {
    const row = corpusPlayerRowFromAggregate('twic', {
      _id: 'carlsen,m',
      usernames: ['Carlsen,M', 'Carlsen, Magnus'],
      title: 'GM',
      gameCount: 42,
      avgRating: 2850,
      maxRating: 2882,
    });

    expect(row.username).toBe('Carlsen, Magnus');
    expect(row.canonicalSlug).toBe('carlsen-magnus');
    expect(row.slugAliases).toEqual(
      expect.arrayContaining(['carlsen-m', 'carlsen-magnus']),
    );
    expect(preferredDisplayUsername(['Carlsen,M', 'Carlsen, Magnus'])).toBe(
      'Carlsen, Magnus',
    );
  });
});
