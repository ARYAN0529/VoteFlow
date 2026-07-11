import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IPollOption {
  _id: Types.ObjectId;
  text: string;
  votes: number;
}

export interface IPoll extends Document {
  title: string;
  options: IPollOption[];
  creator: Types.ObjectId;
  voters: Types.ObjectId[]; // users who already voted, prevents double-voting
  isClosed: boolean;
  createdAt: Date;
}

const PollOptionSchema = new Schema<IPollOption>({
  text: { type: String, required: true, trim: true },
  votes: { type: Number, default: 0 },
});

const PollSchema = new Schema<IPoll>({
  title: { type: String, required: true, trim: true },
  options: {
    type: [PollOptionSchema],
    validate: {
      validator: (opts: IPollOption[]) => opts.length >= 2,
      message: "A poll needs at least 2 options",
    },
  },
  creator: { type: Schema.Types.ObjectId, ref: "User", required: true },
  voters: { type: [Schema.Types.ObjectId], ref: "User", default: [] },
  isClosed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const Poll: Model<IPoll> = mongoose.models.Poll || mongoose.model<IPoll>("Poll", PollSchema);

export default Poll;