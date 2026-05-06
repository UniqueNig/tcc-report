import mongoose, { Document, Schema } from "mongoose";

// Mirrors the ReportField type from unitSchemas.ts
export interface IReportField {
  id: string;
  label: string;
  value: string | number | boolean | string[];
  type: "text" | "number" | "currency" | "textarea" | "boolean" | "select" | "multiselect";
}

export interface IReportSection {
  title: string;
  fields: IReportField[];
}

export interface IReport extends Document {
  title: string;
  unitId: mongoose.Types.ObjectId;
  submittedBy: mongoose.Types.ObjectId;
  status: "pending" | "reviewed";
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  sections: IReportSection[];
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReportFieldSchema = new Schema<IReportField>(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    value: { type: Schema.Types.Mixed, required: true },
    type: {
      type: String,
      enum: ["text", "number", "currency", "textarea", "boolean", "select", "multiselect"],
      required: true,
    },
  },
  { _id: false }
);

const ReportSectionSchema = new Schema<IReportSection>(
  {
    title: { type: String, required: true },
    fields: { type: [ReportFieldSchema], required: true },
  },
  { _id: false }
);

const ReportSchema = new Schema<IReport>(
  {
    title: { type: String, required: true, trim: true },
    unitId: { type: Schema.Types.ObjectId, ref: "Unit", required: true },
    submittedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending", "reviewed"],
      default: "pending",
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    sections: { type: [ReportSectionSchema], required: true },
    attachmentUrl: { type: String },
    attachmentName: { type: String },
    attachmentSize: { type: String },
  },
  { timestamps: true }
);

// Indexes for common queries
ReportSchema.index({ unitId: 1, createdAt: -1 });
ReportSchema.index({ submittedBy: 1, createdAt: -1 });
ReportSchema.index({ status: 1 });

export const Report = mongoose.models.Report ?? mongoose.model<IReport>("Report", ReportSchema);