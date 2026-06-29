import mongoose, { Schema } from 'mongoose';

export type GuestAccountActionKind =
  | 'guest_created'
  | 'guest_resumed'
  | 'guest_merged';

export type GuestAccountActionDoc = {
  action: GuestAccountActionKind;
  guestProviderId: string;
  targetProviderId?: string;
  targetProvider?: string;
  hadMergeableData?: boolean;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
};

const guestAccountActionSchema = new Schema<GuestAccountActionDoc>(
  {
    action: {
      type: String,
      required: true,
      enum: ['guest_created', 'guest_resumed', 'guest_merged'],
    },
    guestProviderId: { type: String, required: true },
    targetProviderId: { type: String, required: false },
    targetProvider: { type: String, required: false },
    hadMergeableData: { type: Boolean, required: false },
    ipAddress: { type: String, required: false },
    userAgent: { type: String, required: false },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false },
);

guestAccountActionSchema.index({ guestProviderId: 1, createdAt: -1 });
guestAccountActionSchema.index({ targetProviderId: 1, createdAt: -1 });
guestAccountActionSchema.index({ ipAddress: 1, createdAt: -1 });
guestAccountActionSchema.index({ action: 1, createdAt: -1 });

export const GuestAccountAction =
  mongoose.models.GuestAccountAction ??
  mongoose.model<GuestAccountActionDoc>(
    'GuestAccountAction',
    guestAccountActionSchema,
    'guest_account_actions',
  );
