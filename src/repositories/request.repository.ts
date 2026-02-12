import { QueryFilter } from "mongoose";
import { IRequest, RequestModel } from "../models/request.model";
import { UserModel } from "../models/user.model";
import { BloodGroupModel } from "../models/blood.model";
import { HospitalModel } from "../models/hospital.model";

export interface IRequestRepostory {
    createRequest(data: Partial<IRequest>): Promise<IRequest>;
    getAllRequests({ page, size, search } : { page: number, size: number, search?: string }) : Promise<{ requests: IRequest[], totalRequests: number }>;
}

export class RequestRepository implements IRequestRepostory {
    async getAllRequests({ page, size, search }: { page: number; size: number; search?: string; }): Promise<{ requests: IRequest[]; totalRequests: number; }> {
        let filter: QueryFilter<IRequest> = {};
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
                { bloodGroup: { $regex: regex } },
                { _id: 1 }
            );

            const hospitals = await HospitalModel.find(
                { name: { $regex: regex } },
                { _id: 1 }
            );

            filter.$or = [
                { recipientId: { $in: users.map(u => u._id) } },
                { recipientBloodId: { $in: bloods.map(b => b._id) } },
                { hospitalId: { $in: hospitals.map(h => h._id) } },
            ];
        }
        const [requests, totalRequests] = await Promise.all([
            RequestModel.find(filter)
                .skip((page - 1) * size)
                .limit(size)
                .populate({
                    path:"recipientBloodId",
                    select: "bloodGroup"
                })
                .populate({
                    path:"hospitalId",
                    select: "name location"
                })
                .populate({
                    path: "recipientId", 
                    select: "fullName phoneNumber email bloodId",
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
    
}