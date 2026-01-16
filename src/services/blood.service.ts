import { BloodGroupRepository } from "../repositories/blood.repository";

let bloodGroupRepository = new BloodGroupRepository();

export class BloodGroupService {
    async getAllBloodGroups(){
        const bloodGroups = await bloodGroupRepository.getAllBloodGroup();
        return bloodGroups;
    }
}