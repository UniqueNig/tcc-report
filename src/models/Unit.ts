import mongoose, { Document, Schema } from "mongoose";

export interface IUnit extends Document {
  name: string;
  coreLeaderId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UnitSchema = new Schema<IUnit>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    coreLeaderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export const Unit = mongoose.models.Unit ?? mongoose.model<IUnit>("Unit", UnitSchema);