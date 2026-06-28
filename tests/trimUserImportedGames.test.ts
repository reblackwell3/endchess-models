import { Types } from 'mongoose';
import { trimUserImportedGames } from '../src/lib/trimUserImportedGames';
import { Analysis } from '../src/models/raw/analysisModel';
import { Game } from '../src/models/raw/gameModel';
import { SystemImportData } from '../src/models/system/systemImportDataModel';

jest.mock('../src/models/raw/analysisModel', () => ({
  Analysis: {
    deleteMany: jest.fn(),
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
const deleteAnalysisMock = Analysis.deleteMany as jest.Mock;

describe('trimUserImportedGames', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    updateImportDataMock.mockResolvedValue(undefined);
    deleteGamesMock.mockResolvedValue(undefined);
    deleteAnalysisMock.mockResolvedValue(undefined);
  });

  it('keeps the most recent games by end_time and deletes the rest', async () => {
    const providerId = 'prov-trim';
    const gameIds = Array.from({ length: 1002 }, () => new Types.ObjectId());

    findImportDataMock.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ importedGames: gameIds }),
      }),
    });

    findGamesMock.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(
          gameIds.map((id, index) => ({
            _id: id,
            end_time: index + 1,
          })),
        ),
      }),
    });

    const result = await trimUserImportedGames(providerId, 1000);

    expect(result).toEqual({
      trimmed: true,
      keptCount: 1000,
      evictedCount: 2,
    });

    const keptIds = updateImportDataMock.mock.calls[0][1].$set.importedGames as Types.ObjectId[];
    expect(keptIds).toHaveLength(1000);
    expect(String(keptIds[0])).toBe(String(gameIds[1001]));
    expect(String(keptIds[999])).toBe(String(gameIds[2]));

    const evictedIds = deleteGamesMock.mock.calls[0][0]._id.$in as Types.ObjectId[];
    expect(evictedIds.map(String)).toEqual([String(gameIds[0]), String(gameIds[1])]);
    expect(deleteAnalysisMock).toHaveBeenCalledWith({
      game: { $in: evictedIds },
    });
  });

  it('does nothing when at or below the limit', async () => {
    const providerId = 'prov-small';
    const gameIds = [new Types.ObjectId()];

    findImportDataMock.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ importedGames: gameIds }),
      }),
    });

    const result = await trimUserImportedGames(providerId, 1000);

    expect(result).toEqual({
      trimmed: false,
      keptCount: 1,
      evictedCount: 0,
    });
    expect(updateImportDataMock).not.toHaveBeenCalled();
    expect(deleteGamesMock).not.toHaveBeenCalled();
    expect(deleteAnalysisMock).not.toHaveBeenCalled();
  });
});
