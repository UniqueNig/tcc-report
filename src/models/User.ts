import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["UNIT_HEAD", "CORE_LEADER", "ADMIN"],
    },
    unitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "units",
    },
  },
  { timestamps: true },
);

// export default mongoose.model("User", userSchema);
const userModel =
  mongoose.models["users"] || mongoose.model("users", userSchema);
export default userModel;

