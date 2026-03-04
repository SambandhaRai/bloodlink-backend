const mockHospitalRepository = {
    addHospital: jest.fn(),
    updateHospital: jest.fn(),
    deleteHospital: jest.fn(),
    getHospitalById: jest.fn(),
    getAllHospitals: jest.fn(),
};

jest.mock("../../repositories/hospital.repository", () => ({
    HospitalRepository: jest.fn(() => mockHospitalRepository),
}));

import { HospitalService } from "../../services/hospital.service";

describe("HospitalService Unit Tests", () => {
    const hospitalService = new HospitalService();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("should throw when hospital id is not found", async () => {
        mockHospitalRepository.getHospitalById.mockResolvedValue(null);

        await expect(hospitalService.getHospitalById("missing-id")).rejects.toMatchObject({
            statusCode: 404,
            message: "Hospital not found",
        });
    });

    test("should return hospital by id", async () => {
        const hospital = { _id: "h1", name: "Test Hospital" };
        mockHospitalRepository.getHospitalById.mockResolvedValue(hospital);

        const result = await hospitalService.getHospitalById("h1");

        expect(mockHospitalRepository.getHospitalById).toHaveBeenCalledWith("h1");
        expect(result).toEqual(hospital);
    });

    test("should parse query params and return hospitals with pagination", async () => {
        mockHospitalRepository.getAllHospitals.mockResolvedValue({
            hospitals: [{ _id: "h1" }],
            totalHospitals: 11,
        });

        const result = await hospitalService.getAllHospitals({
            page: "2",
            size: "5",
            search: "city",
            isActive: "true",
        });

        expect(mockHospitalRepository.getAllHospitals).toHaveBeenCalledWith({
            page: 2,
            size: 5,
            search: "city",
            isActive: true,
        });
        expect(result.pagination).toEqual({ page: 2, size: 5, total: 11, totalPages: 3 });
    });

    test("should use default pagination values", async () => {
        mockHospitalRepository.getAllHospitals.mockResolvedValue({
            hospitals: [],
            totalHospitals: 0,
        });

        const result = await hospitalService.getAllHospitals({});

        expect(mockHospitalRepository.getAllHospitals).toHaveBeenCalledWith({
            page: 1,
            size: 10,
            search: "",
            isActive: undefined,
        });
        expect(result.pagination).toEqual({ page: 1, size: 10, total: 0, totalPages: 0 });
    });

    test("should parse isActive=false correctly", async () => {
        mockHospitalRepository.getAllHospitals.mockResolvedValue({
            hospitals: [],
            totalHospitals: 2,
        });

        await hospitalService.getAllHospitals({ page: "1", size: "10", isActive: "false" });

        expect(mockHospitalRepository.getAllHospitals).toHaveBeenCalledWith({
            page: 1,
            size: 10,
            search: "",
            isActive: false,
        });
    });

    test("should ignore invalid isActive value", async () => {
        mockHospitalRepository.getAllHospitals.mockResolvedValue({
            hospitals: [],
            totalHospitals: 1,
        });

        await hospitalService.getAllHospitals({ page: "1", size: "10", isActive: "maybe" as any });

        expect(mockHospitalRepository.getAllHospitals).toHaveBeenCalledWith({
            page: 1,
            size: 10,
            search: "",
            isActive: undefined,
        });
    });
});
