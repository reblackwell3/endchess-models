import { Types } from 'mongoose';
import {
  evictUserImportedGames,
  planUserImportedGameSync,
} from '../src/lib/planUserImportedGameSync';
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

describe('planUserImportedGameSync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    findAnalysisMock.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    });
  });

  it('plans new candidate inserts and evicts stale library games before save', async () => {
    const providerId = 'prov-sync';
    const staleOld = new Types.ObjectId();
    const staleOlder = new Types.ObjectId();
    mockImportData([staleOld, staleOlder]);

    findGamesMock.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          { _id: staleOld, uuid: 'old-1', end_time: 10 },
          { _id: staleOlder, uuid: 'old-2', end_time: 5 },
        ]),
      }),
    });

    const plan = await planUserImportedGameSync(providerId, 2, {
      candidates: [
        { uuid: 'new-1', end_time: 100 },
        { uuid: 'new-2', end_time: 90 },
      ],
    });

    expect(plan.evictedIds.map(String)).toEqual(
      expect.arrayContaining([String(staleOld), String(staleOlder)]),
    );
    expect(plan.keptExistingIds).toHaveLength(0);
    expect(plan.keptNewCandidateUuids).toEqual(['new-1', 'new-2']);
  });

  it('keeps protected analyzed games and evicts unanalyzed games for new candidates', async () => {
    const providerId = 'prov-protected';
    const analyzed = new Types.ObjectId();
    const unanalyzed = new Types.ObjectId();
    mockImportData([analyzed, unanalyzed]);

    findGamesMock.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          { _id: analyzed, uuid: 'kept-analyzed', end_time: 1 },
          { _id: unanalyzed, uuid: 'evict-me', end_time: 50 },
        ]),
      }),
    });

    findAnalysisMock.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          { game: analyzed, moves: [flatAnalysisMove()] },
        ]),
      }),
    });

    const plan = await planUserImportedGameSync(providerId, 2, {
      candidates: [{ uuid: 'new-1', end_time: 100 }],
    });

    expect(plan.keptExistingIds.map(String)).toEqual([String(analyzed)]);
    expect(plan.evictedIds.map(String)).toEqual([String(unanalyzed)]);
    expect(plan.keptNewCandidateUuids).toEqual(['new-1']);
  });
});

describe('evictUserImportedGames', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    updateImportDataMock.mockResolvedValue(undefined);
    deleteGamesMock.mockResolvedValue(undefined);
    deleteAnalysisMock.mockResolvedValue(undefined);
  });

  it('removes evicted ids from library and hard-deletes games', async () => {
    const providerId = 'prov-evict';
    const evicted = [new Types.ObjectId(), new Types.ObjectId()];

    await evictUserImportedGames(providerId, evicted);

    expect(updateImportDataMock).toHaveBeenCalledWith(
      { providerId },
      { $pull: { importedGames: { $in: evicted } } },
    );
    expect(deleteAnalysisMock).toHaveBeenCalledWith({ game: { $in: evicted } });
    expect(deleteGamesMock).toHaveBeenCalledWith({ _id: { $in: evicted } });
  });
});
