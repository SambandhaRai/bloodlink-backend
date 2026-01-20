import { IBloodGroup, BloodGroupModel } from "../models/blood.model";

export interface IBloodGroupRepository {
    createBloodGroup(data: Partial<IBloodGroup>): Promise<IBloodGroup>;
    getAllBloodGroup(): Promise<IBloodGroup[]>;
    getBloodGroupById(id: String): Promise<IBloodGroup | null>;
    updateBloodGroup(id: String, data: Partial<IBloodGroup>): Promise<IBloodGroup | null>;
    deleteBloodGroup(id: String): Promise<boolean | null>;

    getBloodGroupByName(bloodGroup: String): Promise<IBloodGroup | null>;
}

export class BloodGroupRepository implements IBloodGroupRepository{
    async createBloodGroup(data: Partial<IBloodGroup>): Promise<IBloodGroup> {
        const bloodGroup = new BloodGroupModel(data);
        return await bloodGroup.save();
    }

    async getAllBloodGroup(): Promise<IBloodGroup[]> {
        const bloodGroup = await BloodGroupModel.find();
        return bloodGroup;
    }

    async getBloodGroupById(id: String): Promise<IBloodGroup | null> {
        const bloodGroup = await BloodGroupModel.findById(id);
        return bloodGroup;
    }

    async updateBloodGroup(id: String, data: Partial<IBloodGroup>): Promise<IBloodGroup | null> {
        const bloodGroup = await BloodGroupModel.findByIdAndUpdate(id, data, {new : true});
        return bloodGroup;
    }

    async deleteBloodGroup(id: String): Promise<boolean | null> {
        const result = await BloodGroupModel.findByIdAndDelete(id);
        return result ? true : false;
    }

    async getBloodGroupByName(bloodGroup: String): Promise<IBloodGroup | null> {
        const bloodGroupName = await BloodGroupModel.findOne({"bloodGroup": bloodGroup});
        return bloodGroupName;
    }
}