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

    getMyHistory(userId: mongoose.Types.ObjectId): Promise<{
        donated: IRequest[];
        ongoing: { requestedOngoing: IRequest[]; donationOngoing: IRequest[] };
        received: IRequest[];
    }>;
    getMatchedRequests(args: {
        lng: number;
        lat: number;
        maxDistanceKm: number;
        compatibleBloodIds: mongoose.Types.ObjectId[];
        page: number;
        size: number;
        search?: string;
    }): Promise<{ requests: any[]; totalRequests: number }>;

    getRequestStats(): Promise<{
        total: number;
        pending: number;
        accepted: number;
        finished: number;
    }>;
}

export class RequestRepository implements IRequestRepostory {
    async getMyHistory(userId: mongoose.Types.ObjectId) {
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

    async getMatchedRequests({
        lng,
        lat,
        maxDistanceKm,
        compatibleBloodIds,
        page,
        size,
        search = "",
    }: {
        lng: number;
        lat: number;
        maxDistanceKm: number;
        compatibleBloodIds: mongoose.Types.ObjectId[];
        page: number;
        size: number;
        search?: string;
    }): Promise<{ requests: any[]; totalRequests: number }> {
        const skip = (page - 1) * size;
        const maxDistanceMeters = maxDistanceKm * 1000;

        const compatibleObjectIds = (compatibleBloodIds ?? []).map((id: any) =>
            id instanceof mongoose.Types.ObjectId ? id : new mongoose.Types.ObjectId(String(id))
        );

        const searchStage = search.trim()
            ? {
                $match: {
                    $or: [
                        { recipientDetails: { $regex: search, $options: "i" } },
                        { patientName: { $regex: search, $options: "i" } },
                    ],
                },
            }
            : null;

        const pipeline: any[] = [
            {
                $geoNear: {
                    near: { type: "Point", coordinates: [lng, lat] },
                    key: "location",
                    distanceField: "distanceMeters",
                    maxDistance: maxDistanceMeters,
                    spherical: true,
                    query: { isActive: true },
                },
            },
            {
                $lookup: {
                    from: "requests",
                    let: { hid: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$hospitalId", "$$hid"] },
                                requestStatus: "pending",
                                recipientBloodId: { $in: compatibleObjectIds },
                            },
                        },
                        { $sort: { createdAt: -1 } },
                    ],
                    as: "requests",
                },
            },
            { $unwind: "$requests" },
            {
                $replaceRoot: {
                    newRoot: {
                        $mergeObjects: [
                            "$requests",
                            {
                                __hospitalFromGeo: {
                                    _id: "$_id",
                                    name: "$name",
                                    location: "$location",
                                    distanceMeters: "$distanceMeters",
                                },
                            },
                        ],
                    },
                },
            },
            ...(searchStage ? [searchStage] : []),
            {
                $addFields: {
                    hospitalId: "$__hospitalFromGeo",
                },
            },
            { $project: { __hospitalFromGeo: 0 } },
            {
                $lookup: {
                    from: "bloodgroups",
                    localField: "recipientBloodId",
                    foreignField: "_id",
                    as: "recipientBloodId",
                },
            },
            { $unwind: "$recipientBloodId" },
            {
                $lookup: {
                    from: "users",
                    localField: "postedBy",
                    foreignField: "_id",
                    as: "postedBy",
                },
            },
            { $unwind: "$postedBy" },
            { $project: { "postedBy.password": 0 } },
            {
                $lookup: {
                    from: "bloodgroups",
                    localField: "postedBy.bloodId",
                    foreignField: "_id",
                    as: "postedBy.bloodId",
                },
            },
            {
                $addFields: {
                    "postedBy.bloodId": { $arrayElemAt: ["$postedBy.bloodId", 0] },
                },
            },
            { $sort: { createdAt: -1 } },
            {
                $facet: {
                    requests: [{ $skip: skip }, { $limit: size }],
                    total: [{ $count: "count" }],
                },
            },
            {
                $addFields: {
                    totalRequests: {
                        $ifNull: [{ $arrayElemAt: ["$total.count", 0] }, 0],
                    },
                },
            },
            { $project: { requests: 1, totalRequests: 1 } },
        ];
        const aggRes = await HospitalModel.aggregate(pipeline);
        const first = aggRes[0] || { requests: [], totalRequests: 0 };

        return { requests: first.requests, totalRequests: first.totalRequests };
    }

    async getRequestStats() {
        const [total, pending, accepted, finished] = await Promise.all([
            RequestModel.countDocuments({}),
            RequestModel.countDocuments({ requestStatus: "pending" }),
            RequestModel.countDocuments({ requestStatus: "accepted" }),
            RequestModel.countDocuments({ requestStatus: "finished" }),
        ]);

        return { total, pending, accepted, finished };
    }
}