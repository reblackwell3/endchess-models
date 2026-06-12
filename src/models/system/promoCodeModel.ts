import { Document, model, Schema } from 'mongoose';

export interface IPromoCode extends Document {
  createdAt: Date;
  updatedAt: Date;
  /** Uppercase normalized code entered by users. */
  code: string;
  /** Days of full access granted on redemption. */
  bonusDays: number;
  active: boolean;
  /** Maximum number of times this code can be redeemed globally. */
  maxRedemptions: number;
  redemptionCount: number;
  /** When this code stops accepting new redemptions. */
  expiresAt: Date;
  note?: string;
}

const promoCodeSchema = new Schema<IPromoCode>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    bonusDays: { type: Number, required: true, default: 90 },
    active: { type: Boolean, required: true, default: true },
    maxRedemptions: { type: Number, required: true, min: 1 },
    redemptionCount: { type: Number, required: true, default: 0 },
    expiresAt: { type: Date, required: true },
    note: { type: String, required: false },
  },
  { timestamps: true },
);

export const PromoCode = model<IPromoCode>('PromoCode', promoCodeSchema);
