import mongoose, {Document, Schema} from "mongoose";
import { HospitalType } from "../types/hospital.type";

const HospitalSchema: Schema = new Schema({
    name: { type : String, required : true },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point",
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true,
        validate: {
          validator: function (v: number[]) {
            return Array.isArray(v) && v.length === 2;
          },
          message: "location.coordinates must be [longitude, latitude]",
        },
      },
    },
    isActive: { type: Boolean, default: true },
}, {
    timestamps: true,
});

HospitalSchema.index({ location: "2dsphere" });

export interface IHospital extends HospitalType, Document {
    _id: mongoose.Types.ObjectId,
    createdAt: Date,
    updatedAt: Date,
};

export const HospitalModel = mongoose.model<IHospital>("Hospital", HospitalSchema);