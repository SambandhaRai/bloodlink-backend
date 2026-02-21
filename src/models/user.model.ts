import mongoose, { Document, Schema } from "mongoose";
import { UserType } from "../types/user.type";

const UserSchema: Schema = new Schema({
    fullName: { type: String, required: true, minLength: 2 },
    phoneNumber: { type: String, required: true, minLength: 10, maxLength: 10, unique: true },
    dob: { type: Date, required: true },
    gender: { type: String, required: true },
    bloodId: { type: Schema.Types.ObjectId, ref: "BloodGroup", required: true },
    healthCondition: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, minLength: 6 },
    profilePicture: { type: String, required: false },
    activeAcceptedRequestId: { type: Schema.Types.ObjectId, ref: "Request", default: null },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
}, {
    timestamps: true,
});

export interface IUser extends Omit<UserType, "bloodId" | "activeAcceptedRequestId">, Document {
    _id: mongoose.Types.ObjectId;
    bloodId: mongoose.Types.ObjectId;
    activeAcceptedRequestId: mongoose.Types.ObjectId | null;
    createdAt: Date;
    updatedAt: Date;
}

export const UserModel = mongoose.model<IUser>("User", UserSchema);