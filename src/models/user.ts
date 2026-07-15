import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAuthenticator {
  credentialID: string; // base64url
  credentialPublicKey: Buffer;
  counter: number;
  transports?: string[];
}

export interface IUser extends Document {
  email: string;
  displayName: string;
  currentChallenge?: string;
  authenticators: IAuthenticator[];
  createdAt: Date;
}

const AuthenticatorSchema = new Schema<IAuthenticator>(
  {
    credentialID: { type: String, required: true },
    credentialPublicKey: { type: Buffer, required: true },
    counter: { type: Number, required: true, default: 0 },
    transports: { type: [String], default: [] },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  displayName: { type: String, required: true },
  currentChallenge: { type: String },
  authenticators: { type: [AuthenticatorSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
});

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;