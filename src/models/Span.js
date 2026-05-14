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
  
    await Promise.all([
      UserModel.updateOne(
        { _id: userID },
        { $addToSet: { 
            projects: this.project,   // $addToSet handles ObjectId equality correctly
            spans: this._id 
        }}
      ),
      this.constructor.updateOne(
        { _id: this._id },
        { $addToSet: { staff: userID } }
      ),
    ]);
  };
  spanSchema.methods.removeStaff = async function (userID) {
    const user = await UserModel.findById(userID);
    if (!user) throw new Error("User not found");
  
    await Promise.all([
      UserModel.updateOne({ _id: userID }, { $pull: { spans: this._id } }),
      this.constructor.updateOne({ _id: this._id }, { $pull: { staff: userID } }),
    ]);
  };
export const SpanModel = mongoose.model("Span", spanSchema);