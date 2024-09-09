"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const gameSchema = new mongoose_1.Schema({
    import_from: { type: String, required: true },
    url: { type: String, required: true },
    pgn: { type: String, required: true },
    time_control: { type: String, required: true },
    end_time: { type: Number, required: true },
    rated: { type: Boolean, required: true },
    tcn: { type: String },
    uuid: { type: String, required: true },
    initial_setup: { type: String },
    fen: { type: String },
    time_class: { type: String, required: true },
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
