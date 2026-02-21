import mongoose from "mongoose";
import { CreateRequestDto } from "../dtos/request.dto";
import { RequestRepository } from "../repositories/request.repository";
import { HttpError } from "../errors/http-error";
import { UserRepository } from "../repositories/user.repository";

let requestRepository = new RequestRepository();
let userRepository = new UserRepository();

export class RequestService {
    async createRequest(data: CreateRequestDto, postedBy: string) {
        if (!mongoose.Types.ObjectId.isValid(postedBy)) {
            throw new HttpError(401, "Unauthorized");
        }

        if (!mongoose.Types.ObjectId.isValid(data.recipientBloodId)) {
            throw new HttpError(400, "Invalid recipientBloodId");
        }

        if (!mongoose.Types.ObjectId.isValid(data.hospitalId)) {
            throw new HttpError(400, "Invalid hospitalId");
        }

        if (data.requestFor === "others") {
            if (!data.relationToPatient || data.relationToPatient.trim().length < 2) {
                throw new HttpError(400, "relationToPatient is required when requestFor is 'others'");
            }
            if (!data.patientName || data.patientName.trim().length < 2) {
                throw new HttpError(400, "patientName is required when requestFor is 'others'");
            }
            if (!data.patientPhone || data.patientPhone.trim().length < 6) {
                throw new HttpError(400, "patientPhone is required when requestFor is 'others'");
            }
        }

        const cleanPatientFields =
            data.requestFor === "self"
                ? {
                    relationToPatient: undefined,
                    patientName: undefined,
                    patientPhone: undefined,
                }
                : {
                    relationToPatient: data.relationToPatient?.trim(),
                    patientName: data.patientName?.trim(),
                    patientPhone: data.patientPhone?.trim(),
                };

        const newRequest = await requestRepository.createRequest({
            recipientBloodId: new mongoose.Types.ObjectId(data.recipientBloodId),
            recipientDetails: data.recipientDetails,
            recipientCondition: data.recipientCondition,
            hospitalId: new mongoose.Types.ObjectId(data.hospitalId),
            postedBy: new mongoose.Types.ObjectId(postedBy),
            requestFor: data.requestFor,
            ...cleanPatientFields,
        });

        return newRequest;
    }

    async getAllPendingRequests({ page, size, search }: { page?: string | undefined, size?: string | undefined, search?: string | undefined }) {
        const currentPage = page ? parseInt(page) : 1;
        const currentSize = size ? parseInt(size) : 10;
        const currentSearch = search || "";
        const { requests, totalRequests } = await requestRepository.getAllPendingRequests({ page: currentPage, size: currentSize, search: currentSearch });
        const pagination = {
            page: currentPage,
            size: currentSize,
            total: totalRequests,
            totalPages: Math.ceil(totalRequests / currentSize),
        }
        return { requests, pagination };
    }

    async getRequestById(id: string) {
        const request = await requestRepository.getRequestById(id);
        if (!request) {
            throw new HttpError(404, "Request not found");
        }
        return request;
    }

    async getUserHistory(userId: string) {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new HttpError(401, "Unauthorized");
        }
        return await requestRepository.getUserHistory(new mongoose.Types.ObjectId(userId));
    }

    async acceptRequest(requestId: string, donorId: string) {
        if (!mongoose.Types.ObjectId.isValid(donorId)) {
            throw new HttpError(401, "Unauthorized");
        }

        if (!mongoose.Types.ObjectId.isValid(requestId)) {
            throw new HttpError(401, "Invalid Request Id");
        }

        const currentRequest = await requestRepository.getRequestById(requestId);
        if (!currentRequest) {
            throw new HttpError(404, "Request not found");
        }

        if (currentRequest.requestStatus !== "pending") {
            throw new HttpError(400, `Request already ${currentRequest.requestStatus}`);
        }

        // Cannot accept own request
        if (String(currentRequest.postedBy?._id || currentRequest.postedBy) === String(donorId)) {
            throw new HttpError(400, "Cannot accept your own request");
        }

        // Lock donor (only 1 active request)
        const locked = await userRepository.lockDonorActiveRequest(donorId, requestId);
        if (!locked) {
            throw new HttpError(400, "Cannot accept multiple requests at once.");
        }
        // Accept the request
        const updated = await requestRepository.acceptRequest(
            requestId,
            new mongoose.Types.ObjectId(donorId)
        );
        if (!updated) {
            // rollback lock if request was already accepted
            await userRepository.unlockDonorActiveRequest(donorId, requestId);
            throw new HttpError(400, "This request has already been accepted by someone else.");
        }

        return updated;
    }

    async finishRequest(requestId: string, donorId: string) {
        if (!mongoose.Types.ObjectId.isValid(donorId)) {
            throw new HttpError(401, "Unauthorized");
        }

        if (!mongoose.Types.ObjectId.isValid(requestId)) {
            throw new HttpError(400, "Invalid Request Id");
        }

        const current = await requestRepository.getRequestById(requestId);
        if (!current) {
            throw new HttpError(404, "Request not found")
        };

        const currentDonorId = String(current.donorId?._id || current.donorId || "");
        if (currentDonorId !== String(donorId)) {
            throw new HttpError(403, "Only the donor who accepted this request can finish it");
        }

        const finished = await requestRepository.finishRequest(
            requestId,
            new mongoose.Types.ObjectId(donorId)
        );

        await userRepository.unlockDonorActiveRequest(donorId, requestId);
        return finished;
    }
}