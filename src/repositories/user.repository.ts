import mongoose, { QueryFilter } from "mongoose";
import { IUser, UserModel } from "../models/user.model";

export interface IUserRepository {
    createUser(data: Partial<IUser>): Promise<IUser>;
    getAllUsers({ page, size, search }: { page: number, size: number, search?: string }): Promise<{ users: IUser[], totalUsers: number }>
    getUserById(id: String): Promise<IUser | null>;
    updateOneUser(id: String, data: Partial<IUser>): Promise<IUser | null>;
    deleteOneUser(id: String): Promise<boolean | null>;

    getUserByEmail(email: String): Promise<IUser | null>;
    getUserbyPhoneNumber(phoneNumber: String): Promise<IUser | null>;

    uploadProfilePicture(id: string, profilePicture: string): Promise<IUser | null>;
    updateUserLocation(userId: string, lng: number, lat: number): Promise<IUser | null>;

    lockDonorActiveRequest(userId: string, requestId: string): Promise<IUser | null>;
    unlockDonorActiveRequest(userId: string, requestId: string): Promise<IUser | null>;
}

export class UserRepository implements IUserRepository {

    async uploadProfilePicture(id: string, profilePicture: string): Promise<IUser | null> {
        const updatedUser = await UserModel.findByIdAndUpdate(id, { profilePicture }, { new: true });
        return updatedUser;
    }

    async updateUserLocation(userId: string, lng: number, lat: number): Promise<IUser | null> {
        const updatedUser = await UserModel.findByIdAndUpdate(
            userId,
            {
                $set: {
                    location: {
                        type: "Point",
                        coordinates: [lng, lat],
                    },
                },
            },
            { new: true }
        ).populate("bloodId", "bloodGroup");

        return updatedUser;
    }

    async createUser(data: Partial<IUser>): Promise<IUser> {
        const user = new UserModel(data);
        return await user.save();
    }

    async getAllUsers({ page, size, search }: { page: number, size: number, search?: string }): Promise<{ users: IUser[], totalUsers: number }> {
        let filter: QueryFilter<IUser> = {
            role: "user"
        };
        if (search) {
            filter.$or = [
                { fullName: { $regex: search, $options: "i" } },
                { phoneNumber: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ]
        }
        const [users, totalUsers] = await Promise.all([
            UserModel.find(filter)
                .skip((page - 1) * size)
                .limit(size)
                .populate("bloodId", "bloodGroup"),
            UserModel.countDocuments(filter)
        ]);
        return { users, totalUsers };
    }

    async getUserById(id: String): Promise<IUser | null> {
        const user = await UserModel.findById(id).populate("bloodId", "bloodGroup");
        return user;
    }

    async updateOneUser(id: String, data: Partial<IUser>): Promise<IUser | null> {
        const updatedUser = await UserModel.findByIdAndUpdate(id, data, { new: true });
        return updatedUser;
    }

    async deleteOneUser(id: String): Promise<boolean | null> {
        const result = await UserModel.findByIdAndDelete(id);
        return result ? true : null;
    }

    async getUserByEmail(email: String): Promise<IUser | null> {
        const user = await UserModel.findOne({ "email": email }).populate("bloodId", "bloodGroup");
        return user;
    }

    async getUserbyPhoneNumber(phoneNumber: String): Promise<IUser | null> {
        const user = await UserModel.findOne({ "phoneNumber": phoneNumber }).populate("bloodId", "bloodGroup");
        return user;
    }

    async lockDonorActiveRequest(userId: string, requestId: string) {
        return await UserModel.findOneAndUpdate(
            { _id: userId, activeAcceptedRequestId: null }, // only if not locked
            { $set: { activeAcceptedRequestId: new mongoose.Types.ObjectId(requestId) } },
            { new: true }
        );
    }

    async unlockDonorActiveRequest(userId: string, requestId: string) {
        return await UserModel.findOneAndUpdate(
            { _id: userId, activeAcceptedRequestId: new mongoose.Types.ObjectId(requestId) },
            { $set: { activeAcceptedRequestId: null } },
            { new: true }
        );
    }

}
