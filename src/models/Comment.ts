import mongoose, { Document, Schema } from "mongoose";

export interface IComment extends Document {
  reportId: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  role: "CORE_LEADER" | "ADMIN";
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    reportId: { type: Schema.Types.ObjectId, ref: "Report", required: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: {
      type: String,
      enum: ["CORE_LEADER", "ADMIN"],
      required: true,
    },
    body: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

CommentSchema.index({ reportId: 1, createdAt: 1 });

export const Comment = mongoose.models.Comment ?? mongoose.model<IComment>("Comment", CommentSchema);
