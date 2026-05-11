import mongoose from "mongoose";
import { ROLES, SCOPES_MAP } from "../utils/enums.js";
import bcrypt from "bcrypt";
const userSchema = new mongoose.Schema({
    projects: { type: [mongoose.Schema.Types.ObjectId], ref: "Project" },
    spans: { type: [mongoose.Schema.Types.ObjectId], ref: "Span" },
    name: { type: String, required: true },
    designation: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ROLES },
    scopes: [String],
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });
userSchema.methods.hasScope = function (scope) {
    return this.scopes.includes(scope);
};
userSchema.methods.hasAnyScope = function (scopes) {
    return this.scopes.some(scope => scopes.includes(scope));
};
userSchema.methods.hasAllScopes = function (scopes) {
    return scopes.every(scope => this.scopes.includes(scope));
};
userSchema.pre("save", async function () {
    if (this.isNew) this.scopes = SCOPES_MAP[this.role];
});
export const UserModel = mongoose.model("User", userSchema);