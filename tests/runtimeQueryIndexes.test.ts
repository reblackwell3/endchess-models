import {
  Course,
  CourseSection,
  CorpusPlayer,
  Game,
  ItemEvent,
  Lesson,
  PlayerData,
  User,
} from '../src';

describe('runtime query indexes', () => {
  it('defines case-insensitive recent-player indexes', () => {
    expect(Game.schema.indexes()).toEqual(
      expect.arrayContaining([
        [
          { import_from: 1, 'white.username': 1, end_time: -1 },
          expect.objectContaining({
            name: 'player_white_recent',
            collation: { locale: 'en', strength: 2 },
          }),
        ],
        [
          { import_from: 1, 'black.username': 1, end_time: -1 },
          expect.objectContaining({
            name: 'player_black_recent',
            collation: { locale: 'en', strength: 2 },
          }),
        ],
      ]),
    );
  });

  it('defines feedback, player-data, and email lookup indexes', () => {
    expect(ItemEvent.schema.indexes()).toEqual(
      expect.arrayContaining([
        [{ itemId: 1, eventType: 1, _id: -1 }, expect.any(Object)],
        [
          {
            providerId: 1,
            feature: 1,
            itemId: 1,
            eventType: 1,
            timestamp: 1,
          },
          expect.any(Object),
        ],
      ]),
    );
    expect(PlayerData.schema.indexes()).toEqual(
      expect.arrayContaining([
        [{ providerId: 1, feature: 1 }, expect.any(Object)],
      ]),
    );
    expect(User.schema.indexes()).toEqual(
      expect.arrayContaining([
        [{ email: 1 }, expect.objectContaining({ sparse: true })],
      ]),
    );
  });

  it('defines course read-order indexes', () => {
    expect(Course.schema.indexes()).toEqual(
      expect.arrayContaining([
        [{ slug: 1, generatedAt: -1 }, expect.any(Object)],
      ]),
    );
    expect(CourseSection.schema.indexes()).toEqual(
      expect.arrayContaining([
        [{ courseId: 1, order: 1 }, expect.any(Object)],
      ]),
    );
    expect(Lesson.schema.indexes()).toEqual(
      expect.arrayContaining([
        [{ courseId: 1, order: 1 }, expect.any(Object)],
      ]),
    );
  });

  it('defines both catalog-player sort indexes', () => {
    expect(CorpusPlayer.schema.indexes()).toEqual(
      expect.arrayContaining([
        [
          { importFrom: 1, avgRating: -1, gameCount: -1, nameKey: 1 },
          expect.any(Object),
        ],
        [
          { importFrom: 1, maxRating: -1, gameCount: -1, nameKey: 1 },
          expect.any(Object),
        ],
      ]),
    );
  });
});
