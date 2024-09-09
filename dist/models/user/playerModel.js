"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.playerSchema = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Define the UserEvent schema
const userEventSchema = new mongoose_1.Schema({
    feature: { type: String, required: true },
    itemId: { type: String, required: true }, // I was not able to use an ObjectId here
    event: { type: String, required: true },
});
// Define the Rating schema
const ratingSchema = new mongoose_1.Schema({
    feature: { type: String, required: true },
    rating: { type: Number, required: true },
});
// Define the player schema
exports.playerSchema = new mongoose_1.default.Schema({
    ratings: { type: [ratingSchema], default: [] }, // Array of Rating schema
    events: { type: [userEventSchema], default: [] }, // Array of UserEvent schema
});
// Create the Player model
const Player = mongoose_1.default.model('Player', exports.playerSchema);
exports.default = Player;
//# sourceMappingURL=playerModel.js.map