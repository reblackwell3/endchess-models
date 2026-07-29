import { Types } from 'mongoose';
import {
  Lesson,
  RepertoireDecision,
  type RepertoireDecisionOption,
  resolveRepertoireDecisionOption,
} from '../src';

const option = (
  settingsValue: string,
  overrides: Partial<RepertoireDecisionOption> = {},
): RepertoireDecisionOption => ({
  settingsValue,
  title: `Play ${settingsValue}`,
  courseSlug: `${settingsValue}-course`,
  targetLineKey: `${settingsValue}-line`,
  targetPly: 8,
  ...overrides,
});

describe('RepertoireDecision', () => {
  it('applies publish defaults and preserves handoff targets', () => {
    const targetLessonId = new Types.ObjectId();
    const decision = new RepertoireDecision({
      decisionId: 'white-after-e4',
      collectionKey: 'white-repertoire',
      trainSide: 'w',
      positionKey: 'position-key',
      displayPathUci: ['e2e4'],
      displayPathSan: ['e4'],
      options: [option('italian', { targetLessonId })],
      version: '1.2.0',
    });

    expect(decision.validateSync()).toBeUndefined();
    expect(decision.published).toBe(false);
    expect(decision.generatedAt).toBeInstanceOf(Date);
    expect(decision.options[0].targetLessonId).toEqual(targetLessonId);
  });

  it('rejects duplicate settings values and invalid target plies', () => {
    const duplicateDecision = new RepertoireDecision({
      decisionId: 'white-after-e4',
      collectionKey: 'white-repertoire',
      trainSide: 'w',
      positionKey: 'position-key',
      options: [option('italian'), option('italian')],
      version: '1.2.0',
    });
    expect(
      duplicateDecision.validateSync()?.errors.options?.message,
    ).toContain('settingsValue');

    const invalidPlyDecision = new RepertoireDecision({
      decisionId: 'white-after-e4',
      collectionKey: 'white-repertoire',
      trainSide: 'w',
      positionKey: 'position-key',
      options: [option('italian', { targetPly: -1 })],
      version: '1.2.0',
    });
    expect(
      invalidPlyDecision.validateSync()?.errors['options.0.targetPly'],
    ).toBeDefined();
  });

  it('defines version and published-resolution indexes', () => {
    const indexes = RepertoireDecision.schema.indexes();

    expect(indexes).toEqual(
      expect.arrayContaining([
        [
          { collectionKey: 1, decisionId: 1, version: 1 },
          expect.objectContaining({ unique: true }),
        ],
        [
          {
            collectionKey: 1,
            trainSide: 1,
            positionKey: 1,
            version: 1,
          },
          expect.objectContaining({ unique: true }),
        ],
        [
          {
            decisionId: 1,
            positionKey: 1,
            published: 1,
            publishedAt: -1,
          },
          expect.any(Object),
        ],
      ]),
    );
  });

  it('resolves the exact settings option', () => {
    const italian = option('italian');
    const scotch = option('scotch');
    const decision = { options: [italian, scotch] };

    expect(resolveRepertoireDecisionOption(decision, 'scotch')).toBe(scotch);
    expect(resolveRepertoireDecisionOption(decision, 'missing')).toBeUndefined();
  });
});

describe('lesson repertoire handoff', () => {
  it('stores compact decision metadata on a lesson', () => {
    const lesson = new Lesson({
      courseId: new Types.ObjectId(),
      sectionId: new Types.ObjectId(),
      lineKey: 'line-key',
      order: 0,
      title: 'Lesson',
      type: 'line',
      startFen: '8/8/8/8/8/8/8/8 w - - 0 1',
      movesUci: [],
      movesSan: [],
      trainSide: 'w',
      repertoireHandoff: {
        decisionId: 'white-after-e4',
        positionKey: 'position-key',
        afterPly: 4,
      },
      sourceGameId: 'source',
      sourceMeta: {
        white: 'White',
        black: 'Black',
        whiteElo: 2500,
        blackElo: 2500,
        result: '1-0',
      },
      window: { fromPly: 0, toPly: 0 },
      quality: {
        avgCpLoss: 0,
        maxCpLoss: 0,
        halfMoveCount: 0,
        confirmDepth: 0,
      },
    });

    expect(lesson.validateSync()).toBeUndefined();
    expect(lesson.repertoireHandoff?.afterPly).toBe(4);
  });

  it('allows lessons without a repertoire handoff', () => {
    const lesson = new Lesson({
      courseId: new Types.ObjectId(),
      sectionId: new Types.ObjectId(),
      lineKey: 'line-key',
      order: 0,
      title: 'Lesson',
      type: 'line',
      startFen: '8/8/8/8/8/8/8/8 w - - 0 1',
      movesUci: [],
      movesSan: [],
      trainSide: 'w',
      sourceGameId: 'source',
      sourceMeta: {
        white: 'White',
        black: 'Black',
        whiteElo: 2500,
        blackElo: 2500,
        result: '1-0',
      },
      window: { fromPly: 0, toPly: 0 },
      quality: {
        avgCpLoss: 0,
        maxCpLoss: 0,
        halfMoveCount: 0,
        confirmDepth: 0,
      },
    });

    expect(lesson.validateSync()).toBeUndefined();
    expect(lesson.repertoireHandoff).toBeUndefined();
  });
});
