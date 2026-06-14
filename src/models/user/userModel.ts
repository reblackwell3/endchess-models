import { Document, model, Schema, Types, Model } from 'mongoose';

export interface IAssociatedUsername {
  site: string;
  username: string;
}

export interface IUserDocument extends Document {
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserPlayer {
  elo: number;
  puzzlesCompleted: Types.ObjectId[];
  importedGames: Types.ObjectId[];
  gamesCompleted: Types.ObjectId[];
}

export type SubscriptionStatus =
  | 'none'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'trialing';

export type SubscriptionPlanId = 'pro';

export type SubscriptionBillingInterval = 'monthly' | 'yearly';

export interface IUserSubscription {
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  status: SubscriptionStatus;
  planId?: SubscriptionPlanId;
  billingInterval?: SubscriptionBillingInterval;
  currentPeriodEnd?: Date;
}

export interface IFreeUsageDaily {
  dateKey: string;
  puzzles: number;
  srsReviews: number;
}

export interface IFreeUsage {
  daily?: IFreeUsageDaily;
  lastReplayNewGameAt?: Date;
}

export interface IEmailSendUsage {
  dateKey: string;
  count: number;
}

export interface IUser extends IUserDocument {
  provider: string;
  providerId: string;
  username?: string;
  passwordHash?: string;
  accessToken: string;
  refreshToken: string;
  email?: string;
  emailVerified: boolean;
  name?: string;
  picture?: string;
  givenName?: string;
  familyName?: string;
  associatedUsernames: IAssociatedUsername[];
  player?: IUserPlayer;
  subscription?: IUserSubscription;
  /** Full access until this date for new-user trial or promo extensions. */
  trialEndsAt?: Date;
  /** Manual override for comped/lifetime accounts. */
  isLifetimeMember?: boolean;
  /** Promo codes this user has already redeemed (normalized uppercase). */
  redeemedPromoCodes?: string[];
  freeUsage?: IFreeUsage;
  emailSendUsage?: IEmailSendUsage;
  emailVerificationTokenHash?: string;
  emailVerificationTokenExpiresAt?: Date;
  passwordResetTokenHash?: string;
  passwordResetTokenExpiresAt?: Date;
}

export interface IUserModel extends Model<IUser> {
  findOrCreate: (
    profile: {
      id: string;
      provider: string;
      emails: { value: string }[];
      displayName: string;
      name: { givenName: string; familyName: string };
      photos: { value: string }[];
    },
    accessToken: string,
    refreshToken: string,
  ) => Promise<IUser>;
}

const associatedUsernameSchema = new Schema<IAssociatedUsername>({
  site: { type: String, required: true },
  username: { type: String, required: true },
});

const freeUsageDailySchema = new Schema<IFreeUsageDaily>(
  {
    dateKey: { type: String, required: true },
    puzzles: { type: Number, default: 0 },
    srsReviews: { type: Number, default: 0 },
  },
  { _id: false },
);

const freeUsageSchema = new Schema<IFreeUsage>(
  {
    daily: { type: freeUsageDailySchema, required: false },
    lastReplayNewGameAt: { type: Date, required: false },
  },
  { _id: false },
);

const emailSendUsageSchema = new Schema<IEmailSendUsage>(
  {
    dateKey: { type: String, required: true },
    count: { type: Number, default: 0 },
  },
  { _id: false },
);

const subscriptionSchema = new Schema<IUserSubscription>(
  {
    stripeCustomerId: { type: String, required: false },
    stripeSubscriptionId: { type: String, required: false },
    status: {
      type: String,
      enum: ['none', 'active', 'past_due', 'canceled', 'trialing'],
      default: 'none',
    },
    planId: {
      type: String,
      enum: ['pro'],
      required: false,
    },
    billingInterval: {
      type: String,
      enum: ['monthly', 'yearly'],
      required: false,
    },
    currentPeriodEnd: { type: Date, required: false },
  },
  { _id: false },
);

const userSchema = new Schema<IUser>(
  {
    provider: {
      type: String,
      required: true,
    },
    providerId: {
      type: String,
      required: true,
      unique: true,
    },
    username: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: false,
      select: false,
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
      required: false,
    },
    emailVerified: {
      type: Boolean,
      required: true,
      default: false,
    },
    name: {
      type: String,
      required: false,
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
    associatedUsernames: [associatedUsernameSchema],
    subscription: {
      type: subscriptionSchema,
      required: false,
      default: () => ({ status: 'none' }),
    },
    trialEndsAt: { type: Date, required: false },
    isLifetimeMember: { type: Boolean, required: false, default: false },
    redeemedPromoCodes: [{ type: String }],
    emailVerificationTokenHash: { type: String, required: false, select: false },
    emailVerificationTokenExpiresAt: { type: Date, required: false, select: false },
    passwordResetTokenHash: { type: String, required: false, select: false },
    passwordResetTokenExpiresAt: { type: Date, required: false, select: false },
    freeUsage: {
      type: freeUsageSchema,
      required: false,
    },
    emailSendUsage: {
      type: emailSendUsageSchema,
      required: false,
    },
    player: {
      elo: { type: Number },
      puzzlesCompleted: [{ type: Schema.Types.ObjectId, ref: 'Puzzle' }],
      importedGames: [{ type: Schema.Types.ObjectId, ref: 'Game' }],
      gamesCompleted: [{ type: Schema.Types.ObjectId, ref: 'Game' }],
    },
  },
  { timestamps: true },
);

userSchema.statics.findOrCreate = async function (
  profile: {
    id: string;
    provider: string;
    emails: { value: string }[];
    displayName: string;
    name: { givenName: string; familyName: string };
    photos: { value: string }[];
  },
  accessToken: string,
  refreshToken: string,
) {
  const email = profile.emails?.[0]?.value?.trim() || undefined;
  const givenName = profile.name?.givenName ?? '';
  const familyName = profile.name?.familyName ?? '';
  const displayName =
    profile.displayName?.trim() ||
    [givenName, familyName].filter(Boolean).join(' ') ||
    undefined;
  const picture = profile.photos?.[0]?.value || undefined;

  let user = await this.findOne({
    providerId: profile.id,
  });

  if (!user) {
    const trialEndsAt = new Date();
    trialEndsAt.setUTCDate(trialEndsAt.getUTCDate() + 90);
    user = await this.create({
      provider: profile.provider,
      providerId: profile.id,
      accessToken,
      refreshToken,
      ...(email ? { email } : {}),
      emailVerified: true,
      ...(displayName ? { name: displayName } : {}),
      givenName,
      familyName,
      ...(picture ? { picture } : {}),
      trialEndsAt,
    });
    return user;
  }

  const patch: Record<string, unknown> = { accessToken, refreshToken };
  if (!user.email && email) {
    patch.email = email;
  }
  if (!user.name && displayName) {
    patch.name = displayName;
  }
  if (!user.picture && picture) {
    patch.picture = picture;
  }
  if (!user.givenName && givenName) {
    patch.givenName = givenName;
  }
  if (!user.familyName && familyName) {
    patch.familyName = familyName;
  }
  if (user.provider !== 'local' && user.emailVerified !== true) {
    patch.emailVerified = true;
  }

  if (Object.keys(patch).length > 2) {
    await this.updateOne({ _id: user._id }, { $set: patch });
    user = await this.findById(user._id);
  } else {
    user.accessToken = accessToken;
    user.refreshToken = refreshToken;
    await this.updateOne(
      { _id: user._id },
      { $set: { accessToken, refreshToken } },
    );
  }

  return user;
};

export const User = model<IUser, IUserModel>('User', userSchema);
