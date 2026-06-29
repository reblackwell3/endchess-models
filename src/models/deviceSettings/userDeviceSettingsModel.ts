import mongoose, { Schema } from 'mongoose';
import type { UserDeviceSettingsDoc } from './deviceSettingsDocTypes';

const userDeviceSettingsSchema = new Schema<UserDeviceSettingsDoc>(
  {
    providerId: { type: String, required: true },
    provider: { type: String, required: true },
    isGuest: { type: Boolean, required: true },
    viewportWidth: { type: Number, required: true },
    viewportHeight: { type: Number, required: true },
    screenWidth: { type: Number, required: true },
    screenHeight: { type: Number, required: true },
    devicePixelRatio: { type: Number, required: true },
    viewportBand: {
      type: String,
      required: true,
      enum: ['mobile', 'tabletPortrait', 'tabletLandscape', 'desktop'],
    },
    colorScheme: { type: String, required: false },
    timezone: { type: String, required: false },
    language: { type: String, required: false },
    maxTouchPoints: { type: Number, required: false },
    prefersReducedMotion: { type: Boolean, required: false },
    standalone: { type: Boolean, required: false },
    userAgent: { type: String, required: false },
    ipAddress: { type: String, required: false },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false },
);

userDeviceSettingsSchema.index({ providerId: 1, createdAt: -1 });
userDeviceSettingsSchema.index({ viewportBand: 1, createdAt: -1 });
userDeviceSettingsSchema.index({ isGuest: 1, createdAt: -1 });

export const UserDeviceSettings =
  mongoose.models.UserDeviceSettings ??
  mongoose.model<UserDeviceSettingsDoc>(
    'UserDeviceSettings',
    userDeviceSettingsSchema,
    'user_device_settings',
  );
