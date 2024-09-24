// src/models/raw/analysisModel.test.ts
import { connect, disconnect, Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Analysis } from '../src/models/raw/analysisModel';
import { Game, IGame } from '../src/models/raw/gameModel';
import mockGameData from './__mocks__/game.mock.json';
import mockAnalysisData from './__mocks__/analysis.mock.json';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await connect(uri);
});

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

    // Assertions
    expect(populatedAnalysis).toBeDefined();
    expect(populatedAnalysis!.game).toBeDefined();
    expect((populatedAnalysis!.game as any).importFrom).toBe('chess.com');
    expect(populatedAnalysis!.isTopMove).toBe(true);
    expect(populatedAnalysis!.diff).toBe(5);
    expect(populatedAnalysis!.fen).toBe(
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    );
    expect(populatedAnalysis!.move).toBe('e2e4');
  });
});
