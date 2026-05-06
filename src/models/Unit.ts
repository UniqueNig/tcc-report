import mongoose, { Document, Schema } from "mongoose";

export interface IUnitFormField {
  id: string;
  label: string;
  type: "text" | "number" | "textarea" | "select" | "multiselect" | "boolean" | "currency";
  required: boolean;
  placeholder?: string;
  options?: string[];
  helpText?: string;
}

export interface IUnitFormSection {
  title: string;
  fields: IUnitFormField[];
}

export interface IUnitFormSchema {
  unitName: string;
  sections: IUnitFormSection[];
}

export interface IUnit extends Document {
  name: string;
  coreLeaderId: mongoose.Types.ObjectId;
  formSchema?: IUnitFormSchema;
  createdAt: Date;
  updatedAt: Date;
}

const UnitFormFieldSchema = new Schema<IUnitFormField>(
  {
    id: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["text", "number", "textarea", "select", "multiselect", "boolean", "currency"],
      required: true,
    },
    required: { type: Boolean, default: false },
    placeholder: { type: String, trim: true },
    options: { type: [String], default: undefined },
    helpText: { type: String, trim: true },
  },
  { _id: false }
);

const UnitFormSectionSchema = new Schema<IUnitFormSection>(
  {
    title: { type: String, required: true, trim: true },
    fields: { type: [UnitFormFieldSchema], required: true },
  },
  { _id: false }
);

const UnitFormSchema = new Schema<IUnitFormSchema>(
  {
    unitName: { type: String, required: true, trim: true },
    sections: { type: [UnitFormSectionSchema], required: true },
  },
  { _id: false }
);

const UnitSchema = new Schema<IUnit>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    coreLeaderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    formSchema: { type: UnitFormSchema },
  },
  { timestamps: true }
);

export const Unit = mongoose.models.Unit ?? mongoose.model<IUnit>("Unit", UnitSchema);
