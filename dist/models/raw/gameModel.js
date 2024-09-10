"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const gameSchema = new mongoose_1.Schema({
    importFrom: { type: String, required: true },
    url: { type: String, required: true },
    pgn: { type: String, required: true },
    timeControl: { type: String, required: true },
    endTime: { type: Number, required: true },
    rated: { type: Boolean, required: true },
    tcn: { type: String },
    uuid: { type: String, required: true },
    initialSetup: { type: String },
    fen: { type: String },
    timeClass: { type: String, required: true },
    rules: { type: String, required: true },
    eco: { type: String },
    white: {
        rating: { type: Number, required: true },
        result: { type: String, required: true },
        username: { type: String, required: true },
    },
    black: {
        rating: { type: Number, required: true },
        result: { type: String, required: true },
        username: { type: String, required: true },
    },
    result: { type: String },
});
const Game = (0, mongoose_1.model)('Game', gameSchema);
exports.default = Game;
