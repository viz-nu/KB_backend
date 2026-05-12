import mongoose from 'mongoose';
import { ChapterSchema, VaultSchema } from './Project.js';
import { UserModel } from './User.js';
const terminalSchema = new mongoose.Schema({
    chainNumber: Number,
    placeName: String,
    pointLocation: { type: { type: String, enum: ["Point"], default: "Point" }, coordinates: { type: [Number] } }, // [lng, lat]
});
const spanSchema = new mongoose.Schema({
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    name: String,
    startPoint: terminalSchema,
    endPoint: terminalSchema,
    status: { type: String, enum: ["IN_PROGRESS", "COMPLETED", "CANCELLED", "PENDING"], default: "IN_PROGRESS" },
    chapters: [ChapterSchema],
    Vault: VaultSchema,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    staff: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
}, { timestamps: true });
spanSchema.methods.addStaff = async function (userID) {
    const user = await UserModel.findById(userID);
    if (!user) throw new Error("User not found");
    if (!user.projects.includes(this.project)) user.projects.push(this.project);
    if (!user.spans.includes(this._id)) user.spans.push(this._id);
    if (!this.staff.includes(userID)) this.staff.push(userID);
    await user.save();
    await this.save();
}
spanSchema.methods.removeStaff = async function (userID) {
    const user = await UserModel.findById(userID);
    if (!user) throw new Error("User not found");
    if (user.spans.includes(this._id)) user.spans = user.spans.filter(id => id.toString() !== this._id.toString());
    if (this.staff.includes(userID)) this.staff = this.staff.filter(id => id.toString() !== userID.toString());
    await user.save();
    await this.save();
}
export const SpanModel = mongoose.model("Span", spanSchema);