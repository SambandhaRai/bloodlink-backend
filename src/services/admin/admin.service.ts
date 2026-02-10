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

    async getAllUsers({ page, size, search }: { page?: string | undefined, size?: string | undefined, search?: string | undefined }) {
        const currentPage = page ? parseInt(page) : 1;
        const currentSize = size ? parseInt(size) : 10;
        const currentSearch = search || "";
        const { users, totalUsers } = await userRepository.getAllUsers({ page: currentPage, size: currentSize, search: currentSearch });
        const pagination = {
            page: currentPage, 
            size: currentSize,
            total: totalUsers,
            totalPages: Math.ceil(totalUsers / currentSize),
        }
        return { users, pagination };
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