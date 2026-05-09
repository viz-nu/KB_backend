import mongoose from "mongoose";
import { WorkCategory, EntryStatus } from "../utils/enums.js";

const PhotoSchema = new mongoose.Schema({
    url: { type: String },
    caption: { type: String },
    pointLocation: { type: { type: String, enum: ["Point"], default: "Point" }, coordinates: { type: [Number], } }, // [lng, lat]
    capturedAt: { type: Date },
});
const SemChecklistSchema = new mongoose.Schema({
    parameterId: { type: String },
    label: { type: String },
    value: { type: String },
    passed: { type: Boolean },
    remark: { type: String },
});
const AuditLogSchema = new mongoose.Schema({
    action: { type: String },
    description: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });
const activitySchema = new mongoose.Schema({
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    span: { type: mongoose.Schema.Types.ObjectId, ref: "Span" },
    status: { type: String, required: true, enum: EntryStatus, default: "DRAFT" },
    locationDescription: { type: String },
    remarks: String,
    adminRemark: String,
    returnReason: String,
    measurements: mongoose.Schema.Types.Mixed,
    auditLogs: [AuditLogSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },


    // title: { type: String },
    // WorkCategory: { type: String, required: true, enum: WorkCategory },
    // pointLocation: { type: { type: String, enum: ["Point"], default: "Point" }, coordinates: { type: [Number], } }, // [lng, lat]
    // // 🟩 Area / boundary
    // area: { type: { type: String, enum: ["Polygon"], default: "Polygon" }, coordinates: { type: [[[Number]]] } }, // polygon structure
    // // 📏 Route / path
    // route: { type: { type: String, enum: ["LineString"], default: "LineString" }, coordinates: { type: [[Number]] } }, // line structure
    // description: { type: String },
    // photos: [PhotoSchema],
    // semChecklist: [SemChecklistSchema],

}, { timestamps: true });
export const ActivityModel = mongoose.model("Activity", activitySchema);