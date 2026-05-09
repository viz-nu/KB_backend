import mongoose from "mongoose";
import { ColorCodesEnum, MeasurementTypeEnum, ProjectStatusEnum } from "../utils/enums.js";
export const VaultSchema = new mongoose.Schema({
    allotedBudjet: Number,
    spentBudjet: Number,
    logs: mongoose.Schema.Types.Mixed,
});
const MeasurementSchema = new mongoose.Schema({
    key: { type: String },
    label: { type: String },
    unit: { type: String },
    type: { type: String, enum: MeasurementTypeEnum },
    options: [String],
    billingRate: Number,
    fixedNumber: Number,
    fixedString: String,
    requiresPhoto: Boolean
});
MeasurementSchema.add({ columns: [MeasurementSchema] });
const ItemSchema = new mongoose.Schema({
    label: { type: String },
    code: { type: String },
    description: { type: String },
    measurements: [MeasurementSchema],
});
export const ChapterSchema = new mongoose.Schema({
    name: { type: String },
    code: { type: String },
    color: { type: String, enum: ColorCodesEnum },
    items: [ItemSchema],
});
const projectSchema = new mongoose.Schema({
    name: { type: String },
    description: { type: String },
    code: { type: String },
    Vault: VaultSchema,
    status: { type: String, enum: ProjectStatusEnum, required: true },
    cumulativeProgress: mongoose.Schema.Types.Mixed,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    chapters: [ChapterSchema],
}, { timestamps: true });
projectSchema.methods.addStaff = async function (userID) {
    const user = await UserModel.findById(userID);
    if (!user) throw new Error("User not found");
    if (!user.projects.includes(this._id)) user.projects.push(this._id);
    await user.save();
}
projectSchema.methods.removeStaff = async function (userID) {
    const user = await UserModel.findById(userID);
    if (!user) throw new Error("User not found");
    if (user.projects.includes(this._id)) user.projects = user.projects.filter(id => id.toString() !== this._id.toString());
    await user.save();
}
export const ProjectModel = mongoose.model("Project", projectSchema);