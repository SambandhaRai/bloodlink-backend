import { CreateBloodGroupDto } from "../../dtos/blood.dto";
import { BloodGroupRepository } from "../../repositories/blood.repository";
import { HttpError } from "../../errors/http-error";

let bloodGroupRepository = new BloodGroupRepository();

export class AdminService {
    async createBloodGroup(data: CreateBloodGroupDto){
        const bloodGroupName = await bloodGroupRepository.getBloodGroupByName(data.bloodGroup);
        if(bloodGroupName){
            throw new HttpError(403, "Blood Group already exists");
        }
        const newBloodGroup = await bloodGroupRepository.createBloodGroup(data);
        return newBloodGroup;
    }

    async getAllBloodGroups(){
        const bloodGroups = await bloodGroupRepository.getAllBloodGroup();
        return bloodGroups;
    }
}