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
const userSchema = new mongoose_1.Schema({
    provider: {
        type: String,
        required: true,
    },
    providerId: {
        type: String,
        required: true,
        unique: true,
    },
    accessToken: {
        type: String,
        required: true,
    },
    refreshToken: {
        type: String,
        required: false,
    },
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
userSchema.statics.findOrCreate = function (profile, accessToken, refreshToken) {
    return __awaiter(this, void 0, void 0, function* () {
        let user = yield this.findOne({
            providerId: profile.id,
        });
        if (!user) {
            user = yield this.create({
                provider: profile.provider,
                providerId: profile.id,
                accessToken,
                refreshToken,
                email: profile.emails[0].value,
                emailVerified: true, // Assuming email is verified
                name: profile.displayName,
                givenName: profile.name.givenName,
                familyName: profile.name.familyName,
                picture: profile.photos[0].value,
            });
        }
        return user;
    });
};
const User = (0, mongoose_1.model)('User', userSchema);
exports.default = User;
//# sourceMappingURL=userModel.js.map