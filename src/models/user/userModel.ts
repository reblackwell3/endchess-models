import { Document, model, Schema, Types, Model } from 'mongoose';

export interface IAssociatedUsername {
  site: string;
  username: string;
}

export interface IUserDocument extends Document {
  createdAt: Date;
  updatedAt: Date;
}

export interface IUser extends IUserDocument {
  provider: string;
  providerId: string;
  accessToken: string;
  refreshToken: string;
  email: string;
  emailVerified: boolean;
  name: string;
  picture: string;
  givenName: string;
  familyName: string;
  associatedUsernames: IAssociatedUsername[];
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
    associatedUsernames: [associatedUsernameSchema],
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

export const User = model<IUser, IUserModel>('User', userSchema);
