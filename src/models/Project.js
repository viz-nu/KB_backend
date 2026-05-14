import mongoose from "mongoose";
import { ProjectStatusEnum } from "../utils/enums.js";
import { UserModel } from "./User.js"
export const VaultSchema = new mongoose.Schema({
    allotedBudjet: Number,
    spentBudjet: Number,
    logs: mongoose.Schema.Types.Mixed,
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
    chapters: { type: [mongoose.Schema.Types.ObjectId], ref: "Chapter" },
}, { timestamps: true });
projectSchema.methods.addStaff = async function (userID) {
    const user = await UserModel.findById(userID);
    if (!user) throw new Error("User not found");
    await UserModel.updateOne({ _id: userID }, { $addToSet: { projects: this._id } });
}
projectSchema.methods.removeStaff = async function (userID) {
    const user = await UserModel.findById(userID);
    if (!user) throw new Error("User not found");
    await UserModel.updateOne({ _id: userID }, { $pull: { projects: this._id } });
}
export const ProjectModel = mongoose.model("Project", projectSchema);