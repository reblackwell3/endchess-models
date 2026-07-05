import { Types } from 'mongoose';
import {
  deleteAnalyzedUserGamesOlderThan,
  deleteUserImportedGame,
} from '../src/lib/deleteUserImportedGames';
import { trimUserImportedGames } from '../src/lib/trimUserImportedGames';
import { Analysis } from '../src/models/raw/analysisModel';
import { Game } from '../src/models/raw/gameModel';
import { SystemImportData } from '../src/models/system/systemImportDataModel';

jest.mock('../src/models/raw/analysisModel', () => ({
  Analysis: {
    find: jest.fn(),
    deleteMany: jest.fn(),
  },
  isFlatAnalysisDoc: (analysis: { moves?: unknown[] } | null | undefined) => {
    const first = analysis?.moves?.[0];
    if (!first) return analysis != null;
    return (
      typeof first === 'object' &&
      first != null &&
      'quality' in first &&
      !('lines' in first)
    );
  },
}));

jest.mock('../src/models/raw/gameModel', () => ({
  Game: {
    find: jest.fn(),
    deleteMany: jest.fn(),
    deleteOne: jest.fn(),
  },
}));

jest.mock('../src/models/system/systemImportDataModel', () => ({
  SystemImportData: {
    findOne: jest.fn(),
    updateOne: jest.fn(),
  },
}));

const findImportDataMock = SystemImportData.findOne as jest.Mock;
const updateImportDataMock = SystemImportData.updateOne as jest.Mock;
const findGamesMock = Game.find as jest.Mock;
const deleteGamesMock = Game.deleteMany as jest.Mock;
const findAnalysisMock = Analysis.find as jest.Mock;
const deleteAnalysisMock = Analysis.deleteMany as jest.Mock;

function flatAnalysisMove() {
  return {
    plyIndex: 0,
    fen: 'start',
    playedUci: 'e2e4',
    diff: 0,
    setupEvalCp: 0,
    analysisDepth: 16,
    isTopMove: true,
    quality: 'best',
    expectedPointsLost: 0,
  };
}

function mockImportData(importedGames: Types.ObjectId[]) {
  findImportDataMock.mockReturnValue({
    select: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue({ importedGames }),
    }),
  });
}

describe('trimUserImportedGames', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    updateImportDataMock.mockResolvedValue(undefined);
    deleteGamesMock.mockResolvedValue(undefined);
    deleteAnalysisMock.mockResolvedValue(undefined);
    findAnalysisMock.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    });
  });

  it('evicts oldest unanalyzed games and keeps analyzed games', async () => {
    const providerId = 'prov-trim';
    const analyzedOld = new Types.ObjectId();
    const analyzedNew = new Types.ObjectId();
    const unanalyzedOld = new Types.ObjectId();
    const unanalyzedNew = new Types.ObjectId();
    const gameIds = [analyzedOld, analyzedNew, unanalyzedOld, unanalyzedNew];

    mockImportData(gameIds);

    findGamesMock.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          { _id: analyzedOld, end_time: 1 },
          { _id: analyzedNew, end_time: 4 },
          { _id: unanalyzedOld, end_time: 2 },
          { _id: unanalyzedNew, end_time: 3 },
        ]),
      }),
    });

    findAnalysisMock.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          { game: analyzedOld, moves: [flatAnalysisMove()] },
          { game: analyzedNew, moves: [flatAnalysisMove()] },
        ]),
      }),
    });

    const result = await trimUserImportedGames(providerId, 3);

    expect(result).toEqual({
      trimmed: true,
      keptCount: 3,
      evictedCount: 1,
    });

    const keptIds = updateImportDataMock.mock.calls[0][1].$set
      .importedGames as Types.ObjectId[];
    expect(keptIds.map(String)).toEqual(
      expect.arrayContaining([
        String(analyzedOld),
        String(analyzedNew),
        String(unanalyzedNew),
      ]),
    );
    expect(keptIds.map(String)).not.toContain(String(unanalyzedOld));

    const evictedIds = deleteGamesMock.mock.calls[0][0]._id.$in as Types.ObjectId[];
    expect(evictedIds.map(String)).toEqual([String(unanalyzedOld)]);
  });

  it('does not trim when over cap with only analyzed games', async () => {
    const providerId = 'prov-analyzed-only';
    const gameIds = [new Types.ObjectId(), new Types.ObjectId()];

    mockImportData(gameIds);

    findGamesMock.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(
          gameIds.map((id, index) => ({ _id: id, end_time: index + 1 })),
        ),
      }),
    });

    findAnalysisMock.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(
          gameIds.map((id) => ({ game: id, moves: [flatAnalysisMove()] })),
        ),
      }),
    });

    const result = await trimUserImportedGames(providerId, 1);

    expect(result).toEqual({
      trimmed: false,
      keptCount: 2,
      evictedCount: 0,
    });
    expect(updateImportDataMock).not.toHaveBeenCalled();
    expect(deleteGamesMock).not.toHaveBeenCalled();
  });

  it('does nothing when at or below the limit', async () => {
    const providerId = 'prov-small';
    const gameIds = [new Types.ObjectId()];

    mockImportData(gameIds);

    const result = await trimUserImportedGames(providerId, 100);

    expect(result).toEqual({
      trimmed: false,
      keptCount: 1,
      evictedCount: 0,
    });
    expect(updateImportDataMock).not.toHaveBeenCalled();
    expect(deleteGamesMock).not.toHaveBeenCalled();
    expect(deleteAnalysisMock).not.toHaveBeenCalled();
  });

  it('keeps prioritized unanalyzed ids first when trimming at cap', async () => {
    const providerId = 'prov-priority';
    const olderIds = Array.from({ length: 100 }, () => new Types.ObjectId());
    const newImportIds = [new Types.ObjectId(), new Types.ObjectId()];

    mockImportData([...olderIds, ...newImportIds]);

    findGamesMock.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          ...olderIds.map((id, index) => ({
            _id: id,
            end_time: 1000 + index,
          })),
          ...newImportIds.map((id, index) => ({
            _id: id,
            end_time: 10 + index,
          })),
        ]),
      }),
    });

    const result = await trimUserImportedGames(providerId, 100, {
      prioritizeIds: newImportIds,
    });

    expect(result).toEqual({
      trimmed: true,
      keptCount: 100,
      evictedCount: 2,
    });

    const keptIds = updateImportDataMock.mock.calls[0][1].$set
      .importedGames as Types.ObjectId[];
    expect(keptIds.map(String)).toEqual(
      expect.arrayContaining(newImportIds.map(String)),
    );
    expect(keptIds).toHaveLength(100);
  });
});

describe('deleteUserImportedGame', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    updateImportDataMock.mockResolvedValue(undefined);
    deleteGamesMock.mockResolvedValue({ deletedCount: 1 });
    deleteAnalysisMock.mockResolvedValue(undefined);
  });

  it('hard-deletes an owned imported game', async () => {
    const providerId = 'prov-del';
    const gameId = new Types.ObjectId();

    mockImportData([gameId]);

    const result = await deleteUserImportedGame(providerId, gameId);

    expect(result).toEqual({ deleted: true });
    expect(updateImportDataMock).toHaveBeenCalledWith(
      { providerId },
      { $pull: { importedGames: { $in: [gameId] } } },
    );
    expect(deleteAnalysisMock).toHaveBeenCalledWith({ game: { $in: [gameId] } });
    expect(deleteGamesMock).toHaveBeenCalledWith({ _id: { $in: [gameId] } });
  });

  it('returns deleted false when game is not in library', async () => {
    mockImportData([new Types.ObjectId()]);

    const result = await deleteUserImportedGame(
      'prov-del',
      new Types.ObjectId(),
    );

    expect(result).toEqual({ deleted: false });
    expect(updateImportDataMock).not.toHaveBeenCalled();
  });
});

describe('deleteAnalyzedUserGamesOlderThan', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    updateImportDataMock.mockResolvedValue(undefined);
    deleteGamesMock.mockResolvedValue({ deletedCount: 1 });
    deleteAnalysisMock.mockResolvedValue(undefined);
  });

  it('deletes only ready analyzed games older than cutoff', async () => {
    const providerId = 'prov-prune';
    const oldAnalyzed = new Types.ObjectId();
    const oldUnanalyzed = new Types.ObjectId();
    const recentAnalyzed = new Types.ObjectId();

    mockImportData([oldAnalyzed, oldUnanalyzed, recentAnalyzed]);

    findGamesMock.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          { _id: oldAnalyzed },
          { _id: oldUnanalyzed },
        ]),
      }),
    });

    findAnalysisMock.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          { game: oldAnalyzed, moves: [flatAnalysisMove()] },
        ]),
      }),
    });

    const olderThan = new Date('2020-01-01T00:00:00.000Z');
    const result = await deleteAnalyzedUserGamesOlderThan(providerId, olderThan);

    expect(result).toEqual({ deletedCount: 1 });
    expect(deleteGamesMock).toHaveBeenCalledWith({
      _id: { $in: [oldAnalyzed] },
    });
  });
});
