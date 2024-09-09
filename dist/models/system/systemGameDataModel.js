"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/puzzles/puzzleModel.js
const mongoose_1 = __importDefault(require("mongoose"));
const schema = new mongoose_1.default.Schema({
    providerId: { type: String, required: true, unique: true },
    gameDataArray: { type: (Array), required: true, default: [] },
});
const Puzzle = mongoose_1.default.model('SystemGameData', schema);
exports.default = Puzzle;
