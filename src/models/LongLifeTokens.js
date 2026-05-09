import { Schema, model } from "mongoose";
const longLifeTokenSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tokenId: { type: String, required: true },
    expiresAt: { type: Date, required: true, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    deviceInfo: String,
    isRevoked: { type: Boolean, default: false },
}, { timestamps: true });
export const LongLifeTokenModel = model("LongLifeToken", longLifeTokenSchema);