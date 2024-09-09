"use strict";
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
userSchema.statics.findOrCreate = async function (profile, accessToken, refreshToken) {
    let user = await this.findOne({
        providerId: profile.id,
    });
    if (!user) {
        user = await this.create({
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
};
const User = (0, mongoose_1.model)('User', userSchema);
exports.default = User;
//# sourceMappingURL=userModel.js.map