import mongoose from "mongoose";
import { EntryStatus } from "../utils/enums.js";
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
}, { timestamps: true });
export const ActivityModel = mongoose.model("Activity", activitySchema);