import mongoose from "mongoose";

const ReportSchema = new mongoose.Schema(
  {
    title: String,
    content: String,
    unitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "units",
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    status: {
      type: String,
      default: "PENDING",
    },
  },
  { timestamps: true },
);

const reportModel =
  mongoose.models["reports"] || mongoose.model("reports", ReportSchema);
export default reportModel;

// export const Report =
//   mongoose.models.Report || mongoose.model("Report", ReportSchema);
