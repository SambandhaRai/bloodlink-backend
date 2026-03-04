import mongoose from "mongoose";

const mockRequestRepository = {
    createRequest: jest.fn(),
    getAllPendingRequests: jest.fn(),
    getRequestById: jest.fn(),
    acceptRequest: jest.fn(),
    finishRequest: jest.fn(),
    getMyHistory: jest.fn(),
    getMatchedRequests: jest.fn(),
};

const mockUserRepository = {
    lockDonorActiveRequest: jest.fn(),
    unlockDonorActiveRequest: jest.fn(),
};

const mockUserModel = {
    findById: jest.fn(),
};

const mockBloodGroupModel = {
    find: jest.fn(),
};

jest.mock("../../repositories/request.repository", () => ({
    RequestRepository: jest.fn(() => mockRequestRepository),
}));

jest.mock("../../repositories/user.repository", () => ({
    UserRepository: jest.fn(() => mockUserRepository),
}));

jest.mock("../../models/user.model", () => ({
    UserModel: mockUserModel,
}));

jest.mock("../../models/blood.model", () => ({
    BloodGroupModel: mockBloodGroupModel,
}));

import { RequestService } from "../../services/request.service";

describe("RequestService Unit Tests", () => {
    const requestService = new RequestService();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("should throw on invalid postedBy in createRequest", async () => {
        await expect(
            requestService.createRequest(
                {
                    recipientBloodId: new mongoose.Types.ObjectId().toString(),
                    recipientDetails: "Need donor",
                    recipientCondition: "urgent",
                    hospitalId: new mongoose.Types.ObjectId().toString(),
                    requestFor: "self",
                } as any,
                "invalid-id"
            )
        ).rejects.toMatchObject({ statusCode: 401, message: "Unauthorized" });
    });

    test("should validate patient fields when requestFor is others", async () => {
        await expect(
            requestService.createRequest(
                {
                    recipientBloodId: new mongoose.Types.ObjectId().toString(),
                    recipientDetails: "Need donor",
                    recipientCondition: "critical",
                    hospitalId: new mongoose.Types.ObjectId().toString(),
                    requestFor: "others",
                    relationToPatient: "Brother",
                } as any,
                new mongoose.Types.ObjectId().toString()
            )
        ).rejects.toMatchObject({
            statusCode: 400,
            message: "patientName is required when requestFor is 'others'",
        });
    });

    test("should create request successfully", async () => {
        const created = { _id: "r1", requestStatus: "pending" };
        mockRequestRepository.createRequest.mockResolvedValue(created);

        const postedBy = new mongoose.Types.ObjectId().toString();
        const recipientBloodId = new mongoose.Types.ObjectId().toString();
        const hospitalId = new mongoose.Types.ObjectId().toString();

        const result = await requestService.createRequest(
            {
                recipientBloodId,
                recipientDetails: "Need donor",
                recipientCondition: "stable",
                hospitalId,
                requestFor: "self",
            } as any,
            postedBy
        );

        expect(mockRequestRepository.createRequest).toHaveBeenCalledTimes(1);
        const payload = mockRequestRepository.createRequest.mock.calls[0][0];
        expect(payload.recipientBloodId).toBeInstanceOf(mongoose.Types.ObjectId);
        expect(payload.hospitalId).toBeInstanceOf(mongoose.Types.ObjectId);
        expect(payload.postedBy).toBeInstanceOf(mongoose.Types.ObjectId);
        expect(result).toEqual(created);
    });

    test("should throw when accepting own request", async () => {
        const id = new mongoose.Types.ObjectId().toString();
        mockRequestRepository.getRequestById.mockResolvedValue({
            _id: "r2",
            requestStatus: "pending",
            postedBy: id,
        });

        await expect(requestService.acceptRequest(id, id)).rejects.toMatchObject({
            statusCode: 400,
            message: "Cannot accept your own request",
        });
    });

    test("should rollback donor lock when accept request race occurs", async () => {
        const donorId = new mongoose.Types.ObjectId().toString();
        const requestId = new mongoose.Types.ObjectId().toString();

        mockRequestRepository.getRequestById.mockResolvedValue({
            _id: requestId,
            requestStatus: "pending",
            postedBy: new mongoose.Types.ObjectId().toString(),
        });
        mockUserRepository.lockDonorActiveRequest.mockResolvedValue({ _id: donorId });
        mockRequestRepository.acceptRequest.mockResolvedValue(null);

        await expect(requestService.acceptRequest(requestId, donorId)).rejects.toMatchObject({
            statusCode: 400,
            message: "This request has already been accepted by someone else.",
        });

        expect(mockUserRepository.unlockDonorActiveRequest).toHaveBeenCalledWith(donorId, requestId);
    });

    test("should throw when non-donor tries to finish request", async () => {
        const donorId = new mongoose.Types.ObjectId().toString();
        const requestId = new mongoose.Types.ObjectId().toString();

        mockRequestRepository.getRequestById.mockResolvedValue({
            _id: requestId,
            donorId: new mongoose.Types.ObjectId().toString(),
        });

        await expect(requestService.finishRequest(requestId, donorId)).rejects.toMatchObject({
            statusCode: 403,
            message: "Only the donor who accepted this request can finish it",
        });
    });

    test("should return matched requests with normalized pagination", async () => {
        const userId = new mongoose.Types.ObjectId().toString();
        const compatibleId = new mongoose.Types.ObjectId();

        const populate = jest.fn().mockResolvedValue({ bloodId: { bloodGroup: "O+" } });
        mockUserModel.findById.mockReturnValue({ populate });

        const select = jest.fn().mockResolvedValue([{ _id: compatibleId }]);
        mockBloodGroupModel.find.mockReturnValue({ select });

        mockRequestRepository.getMatchedRequests.mockResolvedValue({
            requests: [{ _id: "r3" }],
            totalRequests: 1,
        });

        const result = await requestService.getMatchedRequests({
            userId,
            lng: 85.3,
            lat: 27.7,
            page: "0",
            size: "100",
            search: "abc",
        });

        expect(mockRequestRepository.getMatchedRequests).toHaveBeenCalledWith(
            expect.objectContaining({
                page: 1,
                size: 50,
                search: "abc",
                maxDistanceKm: 5,
            })
        );
        expect(result.pagination).toEqual({ page: 1, size: 50, total: 1, totalPages: 1 });
        expect(result.requests).toEqual([{ _id: "r3" }]);
    });

    test("should throw unauthorized for invalid user in getAllPendingRequests", async () => {
        await expect(
            requestService.getAllPendingRequests({ userId: "bad-id", page: "1", size: "10" })
        ).rejects.toMatchObject({ statusCode: 401, message: "Unauthorized" });
    });

    test("should return pending requests with pagination", async () => {
        const userId = new mongoose.Types.ObjectId().toString();
        mockRequestRepository.getAllPendingRequests.mockResolvedValue({
            requests: [{ _id: "r4" }],
            totalRequests: 3,
        });

        const result = await requestService.getAllPendingRequests({
            userId,
            page: "2",
            size: "2",
            search: "urgent",
        });

        expect(mockRequestRepository.getAllPendingRequests).toHaveBeenCalledWith(
            expect.objectContaining({
                page: 2,
                size: 2,
                search: "urgent",
            })
        );
        expect(result.pagination).toEqual({ page: 2, size: 2, total: 3, totalPages: 2 });
    });

    test("should throw when request is not found by id", async () => {
        mockRequestRepository.getRequestById.mockResolvedValue(null);

        await expect(requestService.getRequestById("missing")).rejects.toMatchObject({
            statusCode: 404,
            message: "Request not found",
        });
    });

    test("should throw when accept request id is invalid", async () => {
        await expect(
            requestService.acceptRequest("bad-id", new mongoose.Types.ObjectId().toString())
        ).rejects.toMatchObject({ statusCode: 401, message: "Invalid Request Id" });
    });

    test("should throw unauthorized when donor id is invalid on accept", async () => {
        await expect(
            requestService.acceptRequest(new mongoose.Types.ObjectId().toString(), "bad-donor-id")
        ).rejects.toMatchObject({ statusCode: 401, message: "Unauthorized" });
    });

    test("should throw when request is not found on accept", async () => {
        const donorId = new mongoose.Types.ObjectId().toString();
        const requestId = new mongoose.Types.ObjectId().toString();
        mockRequestRepository.getRequestById.mockResolvedValue(null);

        await expect(requestService.acceptRequest(requestId, donorId)).rejects.toMatchObject({
            statusCode: 404,
            message: "Request not found",
        });
    });

    test("should throw when request is already accepted on accept", async () => {
        const donorId = new mongoose.Types.ObjectId().toString();
        const requestId = new mongoose.Types.ObjectId().toString();
        mockRequestRepository.getRequestById.mockResolvedValue({
            _id: requestId,
            requestStatus: "accepted",
            postedBy: new mongoose.Types.ObjectId().toString(),
        });

        await expect(requestService.acceptRequest(requestId, donorId)).rejects.toMatchObject({
            statusCode: 400,
            message: "Request already accepted",
        });
    });

    test("should throw when donor lock is not acquired during accept", async () => {
        const donorId = new mongoose.Types.ObjectId().toString();
        const requestId = new mongoose.Types.ObjectId().toString();
        mockRequestRepository.getRequestById.mockResolvedValue({
            _id: requestId,
            requestStatus: "pending",
            postedBy: new mongoose.Types.ObjectId().toString(),
        });
        mockUserRepository.lockDonorActiveRequest.mockResolvedValue(null);

        await expect(requestService.acceptRequest(requestId, donorId)).rejects.toMatchObject({
            statusCode: 400,
            message: "Cannot accept multiple requests at once.",
        });
    });

    test("should finish request and unlock donor", async () => {
        const donorId = new mongoose.Types.ObjectId().toString();
        const requestId = new mongoose.Types.ObjectId().toString();
        mockRequestRepository.getRequestById.mockResolvedValue({
            _id: requestId,
            donorId,
        });
        mockRequestRepository.finishRequest.mockResolvedValue({ _id: requestId, requestStatus: "finished" });
        mockUserRepository.unlockDonorActiveRequest.mockResolvedValue({ _id: donorId });

        const result = await requestService.finishRequest(requestId, donorId);

        expect(mockRequestRepository.finishRequest).toHaveBeenCalled();
        expect(mockUserRepository.unlockDonorActiveRequest).toHaveBeenCalledWith(donorId, requestId);
        expect(result).toEqual({ _id: requestId, requestStatus: "finished" });
    });

    test("should throw unauthorized in getMyHistory for invalid user id", async () => {
        await expect(requestService.getMyHistory("invalid-user")).rejects.toMatchObject({
            statusCode: 401,
            message: "Unauthorized",
        });
    });

    test("should return history in getMyHistory for valid user id", async () => {
        const userId = new mongoose.Types.ObjectId().toString();
        const history = {
            donated: [],
            ongoing: { requestedOngoing: [], donationOngoing: [] },
            received: [],
        };
        mockRequestRepository.getMyHistory.mockResolvedValue(history);

        const result = await requestService.getMyHistory(userId);

        expect(mockRequestRepository.getMyHistory).toHaveBeenCalled();
        expect(result).toEqual(history);
    });
});
