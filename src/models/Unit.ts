import mongoose from "mongoose";

const UnitSchema = new mongoose.Schema({
  name: String,
  coreLeaderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
  },
});

const unitModel =
  mongoose.models["units"] || mongoose.model("units", UnitSchema);
export default unitModel;

// export const Unit = mongoose.models["units"] || mongoose.model("units", UnitSchema);
