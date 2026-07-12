import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAuthenticator {
  credentialID: string; // base64url
  credentialPublicKey: Buffer;
  counter: number;
  transports?: string[];
}

// interface -> It does not create an object. It only describes what the object should look like.
export interface IUser extends Document {
  username: string;
  displayName: string;
  currentChallenge?: string;
  authenticators: IAuthenticator[];
  createdAt: Date;
}

// creating schema -> It creates an object that defines the structure of the document in the database.
//buffer -> sequence of bytes 
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
  username: { type: String, required: true, unique: true, trim: true },
  displayName: { type: String, required: true },
  currentChallenge: { type: String },
  authenticators: { type: [AuthenticatorSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
});

//creating a model 
let User: Model<IUser>;
if(mongoose.models.User) {
  User = mongoose.models.User;
} else {
  User = mongoose.model<IUser>("User", UserSchema);
}

export default User;