import mongoose, { QueryFilter } from "mongoose";
import { IRequest, RequestModel } from "../models/request.model";
import { UserModel } from "../models/user.model";
import { BloodGroupModel } from "../models/blood.model";
import { HospitalModel } from "../models/hospital.model";

export interface IRequestRepostory {
    createRequest(data: Partial<IRequest>): Promise<IRequest>;
    getAllPendingRequests({ page, size, search }: { page: number, size: number, search?: string }): Promise<{ requests: IRequest[], totalRequests: number }>;
    getRequestById(id: String): Promise<IRequest | null>;

    acceptRequest(requestId: String, donorId: mongoose.Types.ObjectId): Promise<IRequest | null>;
    finishRequest(requestId: String, donorId: mongoose.Types.ObjectId): Promise<IRequest | null>;

    getUserHistory(userId: mongoose.Types.ObjectId): Promise<{
        donated: IRequest[];
        ongoing: { requestedOngoing: IRequest[]; donationOngoing: IRequest[] };
        received: IRequest[];
    }>;
}

export class RequestRepository implements IRequestRepostory {
    async getUserHistory(userId: mongoose.Types.ObjectId) {
        const basePopulate = [
            { path: "recipientBloodId", select: "bloodGroup" },
            { path: "hospitalId", select: "name location" },
            {
                path: "postedBy",
                select: "fullName phoneNumber email profilePicture bloodId",
                populate: { path: "bloodId", select: "bloodGroup" },
            },
            {
                path: "donorId",
                select: "fullName phoneNumber email profilePicture bloodId",
                populate: { path: "bloodId", select: "bloodGroup" },
            },
        ];

        const [donated, requestedOngoing, donationOngoing, received] = await Promise.all([
            RequestModel.find({ donorId: userId, requestStatus: "finished" })
                .sort({ updatedAt: -1 })
                .populate(basePopulate),

            RequestModel.find({ postedBy: userId, requestStatus: { $in: ["pending", "accepted"] } })
                .sort({ createdAt: -1 })
                .populate(basePopulate),
            RequestModel.find({ donorId: userId, requestStatus: "accepted" })
                .sort({ updatedAt: -1 })
                .populate(basePopulate),

            RequestModel.find({ postedBy: userId, requestStatus: "finished" })
                .sort({ updatedAt: -1 })
                .populate(basePopulate),
        ]);

        return { donated, ongoing: { requestedOngoing, donationOngoing }, received };
    }

    async getAllPendingRequests({ page, size, search }: { page: number; size: number; search?: string; }): Promise<{ requests: IRequest[]; totalRequests: number; }> {
        let filter: QueryFilter<IRequest> = {
            "requestStatus": "pending"
        };
        if (search) {
            const regex = new RegExp(search, "i");

            const users = await UserModel.find(
                {
                    $or: [
                        { fullName: { $regex: regex } },
                        { phoneNumber: { $regex: regex } },
                        { email: { $regex: regex } },
                    ],
                },
                { _id: 1 }
            );

            const bloods = await BloodGroupModel.find(
                { bloodGroup: { $regex: search } },
                { _id: 1 }
            );

            const hospitals = await HospitalModel.find(
                { name: { $regex: regex } },
                { _id: 1 }
            );

            filter.$or = [
                { postedBy: { $in: users.map((user) => user._id) } },
                { recipientBloodId: { $in: bloods.map((blood) => blood._id) } },
                { hospitalId: { $in: hospitals.map((hospital) => hospital._id) } },
                { patientName: { $regex: regex } },
            ];
        }
        const [requests, totalRequests] = await Promise.all([
            RequestModel.find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * size)
                .limit(size)
                .populate({
                    path: "recipientBloodId",
                    select: "bloodGroup"
                })
                .populate({
                    path: "hospitalId",
                    select: "name location"
                })
                .populate({
                    path: "postedBy",
                    select: "fullName phoneNumber email profilePicture bloodId",
                    populate: {
                        path: "bloodId",
                        select: "bloodGroup"
                    }
                }),
            RequestModel.countDocuments(filter)
        ]);
        return { requests, totalRequests };
    }

    async createRequest(data: Partial<IRequest>): Promise<IRequest> {
        const request = new RequestModel(data);
        return await request.save();
    }

    async getRequestById(id: String): Promise<IRequest | null> {
        const request = await RequestModel.findById(id)
            .populate({
                path: "recipientBloodId",
                select: "bloodGroup"
            })
            .populate({
                path: "hospitalId",
                select: "name location"
            })
            .populate({
                path: "postedBy",
                select: "fullName phoneNumber email profilePicture bloodId",
                populate: {
                    path: "bloodId",
                    select: "bloodGroup"
                }
            })
            .populate({
                path: "donorId",
                select: "fullName phoneNumber email profilePicture bloodId",
                populate: { path: "bloodId", select: "bloodGroup" },
            });
        return request;
    }

    async acceptRequest(requestId: String, donorId: mongoose.Types.ObjectId): Promise<IRequest | null> {
        const updatedRequest = await RequestModel.findOneAndUpdate(
            { _id: requestId, requestStatus: "pending" },
            { $set: { requestStatus: "accepted", donorId } },
            { new: true }
        )
            .populate({ path: "recipientBloodId", select: "bloodGroup" })
            .populate({ path: "hospitalId", select: "name location" })
            .populate({
                path: "postedBy",
                select: "fullName phoneNumber email profilePicture bloodId",
                populate: { path: "bloodId", select: "bloodGroup" },
            });
        return updatedRequest;
    }

    async finishRequest(requestId: String, donorId: mongoose.Types.ObjectId): Promise<IRequest | null> {
        const finished = await RequestModel.findOneAndUpdate(
            { _id: requestId, requestStatus: "accepted", donorId },
            { $set: { requestStatus: "finished" } },
            { new: true }
        ).populate({ path: "recipientBloodId", select: "bloodGroup" })
            .populate({ path: "hospitalId", select: "name location" })
            .populate({
                path: "postedBy",
                select: "fullName phoneNumber email profilePicture bloodId",
                populate: { path: "bloodId", select: "bloodGroup" },
            })
            .populate({
                path: "donorId",
                select: "fullName phoneNumber email profilePicture bloodId",
                populate: { path: "bloodId", select: "bloodGroup" },
            });

        return finished;
    }
}