import mongoose from "mongoose";
import { EntryStatus } from "../utils/enums.js";

const PhotoSchema = new mongoose.Schema({
    url: { type: String },
    caption: { type: String },
    pointLocation: { type: { type: String, enum: ["Point"], default: "Point" }, coordinates: { type: [Number], } }, // [lng, lat]
    capturedAt: { type: Date },
});
const AuditLogSchema = new mongoose.Schema({
    action: { type: String },
    description: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });
const activitySchema = new mongoose.Schema({
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    span: { type: mongoose.Schema.Types.ObjectId, ref: "Span" },
    status: { type: String, required: true, enum: EntryStatus, default: "SUBMITTED" },
    locationDescription: String,
    remarks: String,
    adminRemark: String,
    returnReason: String,
    WorkCategory: String,
    lineItems: mongoose.Schema.Types.Mixed,
    auditLogs: [AuditLogSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },


    // title: { type: String },
    // : { type: String, required: true, enum: WorkCategory },
    // pointLocation: { type: { type: String, enum: ["Point"], default: "Point" }, coordinates: { type: [Number], } }, // [lng, lat]
    // // 🟩 Area / boundary
    // area: { type: { type: String, enum: ["Polygon"], default: "Polygon" }, coordinates: { type: [[[Number]]] } }, // polygon structure
    // // 📏 Route / path
    // route: { type: { type: String, enum: ["LineString"], default: "LineString" }, coordinates: { type: [[Number]] } }, // line structure
    // description: { type: String },

}, { timestamps: true });
export const ActivityModel = mongoose.model("Activity", activitySchema);