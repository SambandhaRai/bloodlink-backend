import mongoose from "mongoose";
import { CreateRequestDto } from "../dtos/request.dto";
import { RequestRepository } from "../repositories/request.repository";
import { HttpError } from "../errors/http-error";

let requestRepository = new RequestRepository();

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