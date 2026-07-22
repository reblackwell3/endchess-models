// src/models/raw/analysisModel.test.ts
import { connect, disconnect, Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  Analysis,
  summarizeAnalysisMoves,
} from '../src/models/raw/analysisModel';
import { Game } from '../src/models/raw/gameModel';
import mockGameData from './__mocks__/game.mock.json';
import mockAnalysisData from './__mocks__/analysis.mock.json';

let mongoServer: MongoMemoryServer;

jest.setTimeout(300_000);

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await connect(uri);
}, 300_000);

afterAll(async () => {
  await disconnect();
  await mongoServer.stop();
});

describe('Analysis Model Test', () => {
  it('should create a game, add its ObjectId to analysis, and populate the analysis', async () => {
    // Create a Game record from JSON data
    const gameData = {
      ...mockGameData,
      _id: new Types.ObjectId(mockGameData._id),
    };
    const game = new Game(gameData);
    const savedGame = await game.save();

    // Create an Analysis record from JSON data
    const analysisData = {
      ...mockAnalysisData,
      game: new Types.ObjectId(savedGame._id),
    };
    const analysis = new Analysis(analysisData);
    const savedAnalysis = await analysis.save();

    // Retrieve the Analysis record and populate the Game field
    const populatedAnalysis = await Analysis.findById(savedAnalysis._id)
      .populate('game')
      .exec();

    console.log(JSON.stringify(populatedAnalysis, null, 2));

    // Assertions
    expect(populatedAnalysis).toBeDefined();
    expect(populatedAnalysis!.game).toBeDefined();
    expect((populatedAnalysis!.game as any).import_from).toBe('chess.com');
    expect(populatedAnalysis!.moves[0].isTopMove).toBe(true);
    expect(populatedAnalysis!.moves[0].diff).toBe(5);
    expect(populatedAnalysis!.moves[0].fen).toBe(
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    );
    expect(populatedAnalysis!.moves[0].playedUci).toBe('e2e4');
    expect(populatedAnalysis!.moves[0].quality).toBe('best');
    expect(populatedAnalysis!.isReady).toBe(true);
    expect(populatedAnalysis!.moveQualityCounts).toMatchObject({
      best: 1,
      strong: 0,
      inaccuracy: 0,
      mistake: 0,
      blunder: 0,
    });
  });

  it('indexes game and precomputes summaries for move replacements', async () => {
    expect(
      Analysis.schema.indexes().some(([fields]) => fields.game === 1),
    ).toBe(true);

    const gameId = new Types.ObjectId();
    const bestMove = mockAnalysisData.moves[0];
    const moves = [
      bestMove,
      { ...bestMove, plyIndex: 1, quality: 'mistake' as const },
      { ...bestMove, plyIndex: 2, quality: 'blunder' as const },
    ];

    const analysis = await Analysis.findOneAndUpdate(
      { game: gameId },
      { $set: { moves } },
      { new: true, upsert: true },
    ).lean();

    expect(analysis?.isReady).toBe(true);
    expect(analysis?.moveQualityCounts).toEqual({
      best: 1,
      strong: 0,
      inaccuracy: 0,
      mistake: 1,
      blunder: 1,
    });
    expect(summarizeAnalysisMoves([])).toEqual({
      isReady: true,
      moveQualityCounts: {
        best: 0,
        strong: 0,
        inaccuracy: 0,
        mistake: 0,
        blunder: 0,
      },
    });
  });
});
