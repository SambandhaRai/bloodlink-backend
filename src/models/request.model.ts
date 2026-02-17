import mongoose, { Document, Schema } from "mongoose";
import { RequestType } from "../types/request.type";

const RequestSchema: Schema = new Schema({
    recipientBloodId: { type: Schema.Types.ObjectId, ref: "BloodGroup", required: true },
    recipientDetails: { type: String, required: true },
    recipientCondition: { type: String, enum: ["critical", "urgent", "stable"], required: true },
    hospitalId: { type: Schema.Types.ObjectId, ref: "Hospital", required: true },

    postedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

    requestFor: { type: String, enum: ["self", "others"], default: "self" },
    relationToPatient: { type: String },
    patientName: { type: String },
    patientPhone: { type: String },

    donorId: { type: Schema.Types.ObjectId, ref: "User" },

    requestStatus: { type: String, enum: ['pending', 'accepted', 'finished'], default: 'pending' },
}, {
    timestamps: true,
});

export interface IRequest extends Omit<RequestType, "recipientBloodId" | "donorId" | "postedBy" | "hospitalId">, Document {
    _id: mongoose.Types.ObjectId,
    recipientBloodId: mongoose.Types.ObjectId,
    postedBy: mongoose.Types.ObjectId,
    donorId?: mongoose.Types.ObjectId,
    hospitalId: mongoose.Types.ObjectId,
    createdAt: Date,
    updatedAt: Date,
}

export const RequestModel = mongoose.model<IRequest>("Request", RequestSchema);