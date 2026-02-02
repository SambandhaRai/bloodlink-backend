import { CreateBloodGroupDto } from "../../dtos/blood.dto";
import { BloodGroupRepository } from "../../repositories/blood.repository";
import { UserRepository } from "../../repositories/user.repository";
import { HttpError } from "../../errors/http-error";
import { UpdateUserDto } from "../../dtos/user.dto";

let bloodGroupRepository = new BloodGroupRepository();
let userRepository = new UserRepository();

export class AdminService {
    async createBloodGroup(data: CreateBloodGroupDto){
        const bloodGroupName = await bloodGroupRepository.getBloodGroupByName(data.bloodGroup);
        if(bloodGroupName){
            throw new HttpError(403, "Blood Group already exists");
        }
        const newBloodGroup = await bloodGroupRepository.createBloodGroup(data);
        return newBloodGroup;
    }

    async getAllUsers() {
        const users = await userRepository.getAllUsers();
        return users;
    }

    async getUserById(id: string) {
        const user = await userRepository.getUserById(id);
        if(!user) {
            throw new HttpError(404, "User not found");
        }
        return user;
    }

    async updateUser(id: string, data: UpdateUserDto) {
        const user = await userRepository.getUserById(id);
        if(!user) {
            throw new HttpError(404, "User not found");
        }
        const updatedUser = await userRepository.updateOneUser(id, data);
        return updatedUser;
    }

    async deleteUser(id: string) {
        const user = await userRepository.getUserById(id);
        if(!user) {
            throw new HttpError(404, "User not found");
        }
        const deletedUser = await userRepository.deleteOneUser(id);
        return deletedUser
    }
}