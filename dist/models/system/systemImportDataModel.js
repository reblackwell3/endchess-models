"use strict";
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
schema.statics.findOrCreate = async function (providerId) {
    let SystemImportData = await this.findOne({ providerId });
    if (!SystemImportData) {
        SystemImportData = await this.create({ providerId, chessComLinks: [] });
    }
    return SystemImportData;
};
const SystemImportData = (0, mongoose_1.model)('SystemImportData', schema);
exports.default = SystemImportData;
//# sourceMappingURL=systemImportDataModel.js.map