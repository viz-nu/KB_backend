import mongoose from "mongoose";
import { ColorCodesEnum, MeasurementTypeEnum } from "../utils/enums.js";
export const VaultSchema = new mongoose.Schema({
    allotedBudjet: Number,
    spentBudjet: Number,
    logs: mongoose.Schema.Types.Mixed,
});
// const MeasurementSchema = new mongoose.Schema({
//     key: { type: String },
//     label: { type: String },
//     unit: { type: String },
//     type: { type: String, enum: MeasurementTypeEnum },
//     options: [String],
//     billingRate: Number,
//     fixedNumber: Number,
//     fixedString: String,
//     requiresPhoto: Boolean,
//     targetValue: mongoose.Schema.Types.Mixed
// });
// MeasurementSchema.add({ columns: [MeasurementSchema] });
const ItemSchema = new mongoose.Schema({
    label: { type: String },
    code: { type: String },
    description: { type: String },
    measurements: mongoose.Schema.Types.Mixed,
});
export const ChapterSchema = new mongoose.Schema({
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    name: { type: String },
    code: { type: String },
    color: { type: String, enum: ColorCodesEnum },
    items: [ItemSchema]
});
export const ChapterModel = mongoose.model("Chapter", ChapterSchema);