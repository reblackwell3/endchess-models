"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userDetailsSchema = void 0;
const mongoose_1 = require("mongoose");
exports.userDetailsSchema = new mongoose_1.Schema({
    email: {
        type: String,
        required: true,
    },
    emailVerified: {
        type: Boolean,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    picture: {
        type: String,
        required: false,
    },
    givenName: {
        type: String,
        required: false,
    },
    familyName: {
        type: String,
        required: false,
    },
}, { timestamps: true });
const UserDetails = (0, mongoose_1.model)('UserDetails', exports.userDetailsSchema);
exports.default = UserDetails;
//# sourceMappingURL=userDetailsModel.js.map