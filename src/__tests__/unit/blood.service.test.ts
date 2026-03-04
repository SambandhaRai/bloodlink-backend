const mockBloodGroupRepository = {
    getAllBloodGroup: jest.fn(),
    getBloodGroupById: jest.fn(),
    getBloodGroupByName: jest.fn(),
    createBloodGroup: jest.fn(),
};

jest.mock("../../repositories/blood.repository", () => ({
    BloodGroupRepository: jest.fn(() => mockBloodGroupRepository),
}));

import { BloodGroupService } from "../../services/blood.service";

describe("BloodGroupService Unit Tests", () => {
    const bloodService = new BloodGroupService();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("should return all blood groups", async () => {
        const groups = [{ bloodGroup: "A+" }, { bloodGroup: "O-" }];
        mockBloodGroupRepository.getAllBloodGroup.mockResolvedValue(groups);

        const result = await bloodService.getAllBloodGroups();

        expect(mockBloodGroupRepository.getAllBloodGroup).toHaveBeenCalledTimes(1);
        expect(result).toEqual(groups);
    });

    test("should return blood group by id", async () => {
        const blood = { _id: "b1", bloodGroup: "AB+" };
        mockBloodGroupRepository.getBloodGroupById.mockResolvedValue(blood);

        const result = await bloodService.getBloodGroupById("b1");

        expect(mockBloodGroupRepository.getBloodGroupById).toHaveBeenCalledWith("b1");
        expect(result).toEqual(blood);
    });
});
