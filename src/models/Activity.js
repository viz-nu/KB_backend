import mongoose from "mongoose";
import { EntryStatus } from "../utils/enums.js";
const AuditLogSchema = new mongoose.Schema({
    action: { type: String },
    description: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });
const RemarksSchema = new mongoose.Schema({
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    notes: { type: String },
}, { timestamps: true });
const activitySchema = new mongoose.Schema({
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    span: { type: mongoose.Schema.Types.ObjectId, ref: "Span" },
    status: { type: String, required: true, enum: EntryStatus, default: "SUBMITTED" },
    locationDescription: String,
    remarks: [RemarksSchema],
    chapter: { type: mongoose.Schema.Types.ObjectId, ref: "Chapter" },
    lineItems: mongoose.Schema.Types.Mixed,
    auditLogs: [AuditLogSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    chinageFrom: { type: Number },
    chinageTo: { type: Number },
}, { timestamps: true });
export const ActivityModel = mongoose.model("Activity", activitySchema);