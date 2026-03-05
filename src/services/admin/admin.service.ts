import { CreateBloodGroupDto } from "../../dtos/blood.dto";
import { BloodGroupRepository } from "../../repositories/blood.repository";
import { UserRepository } from "../../repositories/user.repository";
import { HttpError } from "../../errors/http-error";
import { UpdateUserDto } from "../../dtos/user.dto";
import { CreateHospitalDto, UpdateHospitalDto } from "../../dtos/hospital.dto";
import { HospitalRepository } from "../../repositories/hospital.repository";
import mongoose from "mongoose";
import { UserModel } from "../../models/user.model";
import { RequestRepository } from "../../repositories/request.repository";

let hospitalRepository = new HospitalRepository();
let bloodGroupRepository = new BloodGroupRepository();
let requestRepository = new RequestRepository();
let userRepository = new UserRepository();

export class AdminService {
    async createBloodGroup(data: CreateBloodGroupDto) {
        const bloodGroupName = await bloodGroupRepository.getBloodGroupByName(data.bloodGroup);
        if (bloodGroupName) {
            throw new HttpError(403, "Blood Group already exists");
        }
        const newBloodGroup = await bloodGroupRepository.createBloodGroup(data);
        return newBloodGroup;
    }

    async addHospital(data: CreateHospitalDto) {
        const newHospital = await hospitalRepository.addHospital(data);
        return newHospital;
    }

    async updateHospital(hospitalId: string, data: UpdateHospitalDto) {
        const hospital = await hospitalRepository.getHospitalById(hospitalId);
        if (!hospital) {
            throw new HttpError(404, "Hospital not found");
        }
        const updatedHospital = await hospitalRepository.updateHospital(hospitalId, data);
        return updatedHospital;
    }

    async deleteHospital(hospitalId: string) {
        const hospital = await hospitalRepository.getHospitalById(hospitalId);
        if (!hospital) {
            throw new HttpError(404, "Hospital not found");
        }
        const deleted = await hospitalRepository.deleteHospital(hospitalId);
        return deleted;
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
        if (!user) {
            throw new HttpError(404, "User not found");
        }
        return user;
    }

    async updateUser(id: string, data: UpdateUserDto) {
        const user = await userRepository.getUserById(id);
        if (!user) {
            throw new HttpError(404, "User not found");
        }
        const payload: any = { ...data };

        if (data.bloodId) {
            if (!mongoose.Types.ObjectId.isValid(data.bloodId)) {
                throw new HttpError(400, "Invalid bloodId");
            }
            payload.bloodId = new mongoose.Types.ObjectId(data.bloodId);
        }
        const updatedUser = await userRepository.updateOneUser(id, payload);
        return updatedUser;
    }

    async deleteUser(id: string) {
        const user = await userRepository.getUserById(id);
        if (!user) {
            throw new HttpError(404, "User not found");
        }
        const deletedUser = await userRepository.deleteOneUser(id);
        return deletedUser;
    }

    async getUserHistoryAdmin(userId: string) {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new HttpError(400, "Invalid user id");
        }

        const exists = await UserModel.exists({ _id: userId });
        if (!exists) {
            throw new HttpError(404, "User not found");
        }

        const history = await requestRepository.getMyHistory(new mongoose.Types.ObjectId(userId));

        const donatedCount = history.donated?.length || 0;
        const receivedCount = history.received?.length || 0;

        const requestedOngoingCount = history.ongoing?.requestedOngoing?.length || 0;
        const donationOngoingCount = history.ongoing?.donationOngoing?.length || 0;

        return {
            ...history,
            counts: {
                donated: donatedCount,
                received: receivedCount,
                requestedOngoing: requestedOngoingCount,
                donationOngoing: donationOngoingCount,
                totalOngoing: requestedOngoingCount + donationOngoingCount,
                total:
                    donatedCount +
                    receivedCount +
                    requestedOngoingCount +
                    donationOngoingCount,
            },
        };
    }

    async getRequestStatsAdmin() {
        const stats = await requestRepository.getRequestStats();

        return {
            totalRequests: stats.total,
            pendingRequests: stats.pending,
            acceptedRequests: stats.accepted,
            finishedRequests: stats.finished,
        };
    }
}