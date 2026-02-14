import mongoose from "mongoose";
import { CreateRequestDto } from "../dtos/request.dto";
import { RequestRepository } from "../repositories/request.repository";
import { HttpError } from "../errors/http-error";

let requestRepository = new RequestRepository();

export class RequestService {
    async createRequest(data: CreateRequestDto, recipientId: string) {
        if (!mongoose.Types.ObjectId.isValid(recipientId)) {
            throw new HttpError(401, "Unauthorized");
        }

        if (!mongoose.Types.ObjectId.isValid(data.recipientBloodId)) {
            throw new HttpError(400, "Invalid recipientBloodId");
        }

        if (!mongoose.Types.ObjectId.isValid(data.hospitalId)) {
            throw new HttpError(400, "Invalid hospitalId");
        }

        const newRequest = await requestRepository.createRequest({
            recipientBloodId: new mongoose.Types.ObjectId(data.recipientBloodId),
            recipientDetails: data.recipientDetails,
            recipientCondition: data.recipientCondition,
            hospitalId: new mongoose.Types.ObjectId(data.hospitalId),
            recipientId: new mongoose.Types.ObjectId(recipientId),
        });

        return newRequest;
    }

    async getAllRequests({ page, size, search }: { page?: string | undefined, size?: string | undefined, search?: string | undefined }) {
        const currentPage = page ? parseInt(page) : 1;
        const currentSize = size ? parseInt(size) : 10;
        const currentSearch = search || "";
        const { requests, totalRequests } = await requestRepository.getAllRequests({ page: currentPage, size: currentSize, search: currentSearch });
        const pagination = {
            page: currentPage,
            size: currentSize,
            total: totalRequests,
            totalPages: Math.ceil(totalRequests / currentSize),
        }
        return { requests, pagination };
    }
}