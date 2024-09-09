"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
    providerId: {
        type: String,
        required: true,
        unique: true,
    },
    chessComLinks: [
        {
            url: {
                type: String,
                required: true,
            },
            isImported: {
                type: Boolean,
                required: true,
            },
        },
    ],
    lichessLinks: [
        {
            since: {
                type: Number,
                required: true,
            },
            until: {
                type: Number,
                required: true,
            },
            isImported: {
                type: Boolean,
                required: true,
            },
        },
    ],
}, { timestamps: true });
schema.statics.findOrCreate = function (providerId) {
    return __awaiter(this, void 0, void 0, function* () {
        let SystemImportData = yield this.findOne({ providerId });
        if (!SystemImportData) {
            SystemImportData = yield this.create({ providerId, chessComLinks: [] });
        }
        return SystemImportData;
    });
};
const SystemImportData = (0, mongoose_1.model)('SystemImportData', schema);
exports.default = SystemImportData;
