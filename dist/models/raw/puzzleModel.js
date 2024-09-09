"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/puzzles/puzzleModel.js
const mongoose_1 = __importDefault(require("mongoose"));
const puzzleSchema = new mongoose_1.default.Schema({
    PuzzleId: String,
    FEN: String,
    Moves: String,
    Rating: Number,
    RatingDeviation: Number,
    Popularity: Number,
    NbPlays: Number,
    Themes: String,
    GameUrl: String,
    OpeningTags: String,
});
const Puzzle = mongoose_1.default.model('Puzzle', puzzleSchema);
exports.default = Puzzle;
