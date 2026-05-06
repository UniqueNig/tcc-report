import mongoose, { Document, Schema } from "mongoose";
import type { UserRole } from "@/src/lib/auth";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  unitId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String, required: true, unique: true,
      lowercase: true, trim: true,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["UNIT_HEAD", "CORE_LEADER", "ADMIN"],
      required: true,
    },
    unitId: {
      type: Schema.Types.ObjectId,
      ref: "Unit",
      required: false,
    },
  },
  { timestamps: true }
);

// Prevent model re-compilation in Next.js hot reload
export const User = mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);