import { QueryFilter } from "mongoose";
import { IHospital, HospitalModel } from "../models/hospital.model";

export interface IHospitalRepository {
    addHospital(data: Partial<IHospital>): Promise<IHospital>;
    updateHospital(id: String, data: Partial<IHospital>): Promise<IHospital | null>;
    getAllHospitals({ page, size, search }: { page: number, size: number, search?: string }): Promise<{ hospitals: IHospital[], totalHospitals: number }>;
    getHospitalById(id: String): Promise<IHospital | null>;
}

export class HospitalRepository implements IHospitalRepository {

    async addHospital(data: Partial<IHospital>): Promise<IHospital> {
        const hospital = new HospitalModel(data);
        return await hospital.save();
    }

    async updateHospital(id: String, data: Partial<IHospital>): Promise<IHospital | null> {
        const updatedHospital = await HospitalModel.findByIdAndUpdate(id, data, { new: true });
        return updatedHospital;
    }

    async getAllHospitals({ page, size, search, isActive }: { page: number; size: number; search?: string; isActive?: boolean; }): Promise<{ hospitals: IHospital[]; totalHospitals: number; }> {
        let filter: QueryFilter<IHospital> = {};
        if (typeof isActive === "boolean") {
            filter.isActive = isActive;
        }
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
            ]
        }
        const [hospitals, totalHospitals] = await Promise.all([
            HospitalModel.find(filter).skip((page - 1) * size).limit(size),
            HospitalModel.countDocuments(filter)
        ]);
        return { hospitals, totalHospitals };
    }

    async getHospitalById(id: String): Promise<IHospital | null> {
        const hospital = await HospitalModel.findById(id);
        return hospital;
    }

}