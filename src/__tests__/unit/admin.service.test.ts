import mongoose from "mongoose";

const mockHospitalRepository = {
    addHospital: jest.fn(),
    updateHospital: jest.fn(),
    deleteHospital: jest.fn(),
    getHospitalById: jest.fn(),
};

const mockBloodGroupRepository = {
    getBloodGroupByName: jest.fn(),
    createBloodGroup: jest.fn(),
};

const mockRequestRepository = {
    getMyHistory: jest.fn(),
    getRequestStats: jest.fn(),
};

const mockUserRepository = {
    getAllUsers: jest.fn(),
    getUserById: jest.fn(),
    updateOneUser: jest.fn(),
    deleteOneUser: jest.fn(),
};

const mockUserModel = {
    exists: jest.fn(),
};

jest.mock("../../repositories/hospital.repository", () => ({
    HospitalRepository: jest.fn(() => mockHospitalRepository),
}));

jest.mock("../../repositories/blood.repository", () => ({
    BloodGroupRepository: jest.fn(() => mockBloodGroupRepository),
}));

jest.mock("../../repositories/request.repository", () => ({
    RequestRepository: jest.fn(() => mockRequestRepository),
}));

jest.mock("../../repositories/user.repository", () => ({
    UserRepository: jest.fn(() => mockUserRepository),
}));

jest.mock("../../models/user.model", () => ({
    UserModel: mockUserModel,
}));

import { AdminService } from "../../services/admin/admin.service";

describe("AdminService Unit Tests", () => {
    const adminService = new AdminService();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("should throw when creating duplicate blood group", async () => {
        mockBloodGroupRepository.getBloodGroupByName.mockResolvedValue({ _id: "b1" });

        await expect(adminService.createBloodGroup({ bloodGroup: "A+" })).rejects.toMatchObject({
            statusCode: 403,
            message: "Blood Group already exists",
        });
    });

    test("should create blood group when not existing", async () => {
        mockBloodGroupRepository.getBloodGroupByName.mockResolvedValue(null);
        mockBloodGroupRepository.createBloodGroup.mockResolvedValue({ _id: "b2", bloodGroup: "B+" });

        const result = await adminService.createBloodGroup({ bloodGroup: "B+" });

        expect(mockBloodGroupRepository.createBloodGroup).toHaveBeenCalledWith({ bloodGroup: "B+" });
        expect(result).toEqual({ _id: "b2", bloodGroup: "B+" });
    });

    test("should add hospital successfully", async () => {
        const payload = {
            name: "New Hospital",
            location: { type: "Point", coordinates: [85.3, 27.7] },
        } as any;
        mockHospitalRepository.addHospital.mockResolvedValue({ _id: "h2", ...payload });

        const result = await adminService.addHospital(payload);

        expect(mockHospitalRepository.addHospital).toHaveBeenCalledWith(payload);
        expect(result).toHaveProperty("_id", "h2");
    });

    test("should throw when updating non-existing hospital", async () => {
        mockHospitalRepository.getHospitalById.mockResolvedValue(null);

        await expect(
            adminService.updateHospital(new mongoose.Types.ObjectId().toString(), { name: "New Name" })
        ).rejects.toMatchObject({ statusCode: 404, message: "Hospital not found" });
    });

    test("should map pagination in getAllUsers", async () => {
        mockUserRepository.getAllUsers.mockResolvedValue({ users: [{ _id: "u1" }], totalUsers: 7 });

        const result = await adminService.getAllUsers({ page: "2", size: "3", search: "john" });

        expect(mockUserRepository.getAllUsers).toHaveBeenCalledWith({ page: 2, size: 3, search: "john" });
        expect(result.pagination).toEqual({ page: 2, size: 3, total: 7, totalPages: 3 });
    });

    test("should throw when updateUser has invalid bloodId", async () => {
        const userId = new mongoose.Types.ObjectId().toString();
        mockUserRepository.getUserById.mockResolvedValue({ _id: userId, email: "a@test.com" });

        await expect(
            adminService.updateUser(userId, { bloodId: "invalid" } as any)
        ).rejects.toMatchObject({ statusCode: 400, message: "Invalid bloodId" });
    });

    test("should throw when getUserById user does not exist", async () => {
        mockUserRepository.getUserById.mockResolvedValue(null);

        await expect(
            adminService.getUserById(new mongoose.Types.ObjectId().toString())
        ).rejects.toMatchObject({ statusCode: 404, message: "User not found" });
    });

    test("should throw when updateUser target does not exist", async () => {
        mockUserRepository.getUserById.mockResolvedValue(null);

        await expect(
            adminService.updateUser(new mongoose.Types.ObjectId().toString(), { fullName: "X" } as any)
        ).rejects.toMatchObject({ statusCode: 404, message: "User not found" });
    });

    test("should throw for invalid userId in getUserHistoryAdmin", async () => {
        await expect(adminService.getUserHistoryAdmin("invalid-id")).rejects.toMatchObject({
            statusCode: 400,
            message: "Invalid user id",
        });
    });

    test("should return user history with computed counts", async () => {
        const userId = new mongoose.Types.ObjectId().toString();
        mockUserModel.exists.mockResolvedValue(true);
        mockRequestRepository.getMyHistory.mockResolvedValue({
            donated: [{ _id: 1 }],
            ongoing: { requestedOngoing: [{ _id: 2 }, { _id: 3 }], donationOngoing: [{ _id: 4 }] },
            received: [{ _id: 5 }],
        });

        const result = await adminService.getUserHistoryAdmin(userId);

        expect(result.counts).toEqual({
            donated: 1,
            received: 1,
            requestedOngoing: 2,
            donationOngoing: 1,
            totalOngoing: 3,
            total: 5,
        });
    });

    test("should map request stats response", async () => {
        mockRequestRepository.getRequestStats.mockResolvedValue({
            total: 12,
            pending: 3,
            accepted: 4,
            finished: 5,
        });

        const result = await adminService.getRequestStatsAdmin();

        expect(result).toEqual({
            totalRequests: 12,
            pendingRequests: 3,
            acceptedRequests: 4,
            finishedRequests: 5,
        });
    });

    test("should delete hospital when it exists", async () => {
        const hospitalId = new mongoose.Types.ObjectId().toString();
        mockHospitalRepository.getHospitalById.mockResolvedValue({ _id: hospitalId });
        mockHospitalRepository.deleteHospital.mockResolvedValue(true);

        const result = await adminService.deleteHospital(hospitalId);

        expect(mockHospitalRepository.deleteHospital).toHaveBeenCalledWith(hospitalId);
        expect(result).toBe(true);
    });

    test("should throw when deleteHospital target is missing", async () => {
        const hospitalId = new mongoose.Types.ObjectId().toString();
        mockHospitalRepository.getHospitalById.mockResolvedValue(null);

        await expect(adminService.deleteHospital(hospitalId)).rejects.toMatchObject({
            statusCode: 404,
            message: "Hospital not found",
        });
    });

    test("should delete user when user exists", async () => {
        const userId = new mongoose.Types.ObjectId().toString();
        mockUserRepository.getUserById.mockResolvedValue({ _id: userId, email: "u@test.com" });
        mockUserRepository.deleteOneUser.mockResolvedValue(true);

        const result = await adminService.deleteUser(userId);

        expect(mockUserRepository.deleteOneUser).toHaveBeenCalledWith(userId);
        expect(result).toBe(true);
    });

    test("should throw when deleteUser target does not exist", async () => {
        const userId = new mongoose.Types.ObjectId().toString();
        mockUserRepository.getUserById.mockResolvedValue(null);

        await expect(adminService.deleteUser(userId)).rejects.toMatchObject({
            statusCode: 404,
            message: "User not found",
        });
    });
});
