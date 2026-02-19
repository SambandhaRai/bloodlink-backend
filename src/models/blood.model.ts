import mongoose, { Document, Schema } from "mongoose";
import { BloodGroupType } from "../types/blood.type";

const BloodGroupSchema: Schema = new Schema({
    bloodGroup: { type: String, required: true }
});

export interface IBloodGroup extends BloodGroupType, Document {
    _id: mongoose.Types.ObjectId,
    createdAt: Date,
    updatedAt: Date,
}

export const BloodGroupModel = mongoose.model<IBloodGroup>("BloodGroup", BloodGroupSchema);
