import { CreateBloodGroupDto } from "../../dtos/blood.dto";
import { UpdateUserDto } from "../../dtos/user.dto";
import { AdminService } from "../../services/admin/admin.service";
import { NextFunction, Request, Response } from "express";
import z from "zod";

let adminService = new AdminService();

export class AdminUserController {
    async createBloodGroup(req: Request, res: Response) {
        try{
            const parsedData = CreateBloodGroupDto.safeParse(req.body);
            if(!parsedData.success){
                return res.status(400).json(
                    { success: false, errors: z.prettifyError(parsedData.error) }
                );
            }
            const newBloodGroup = await adminService.createBloodGroup(parsedData.data);
            return res.status(201).json(
                { success: true, data: newBloodGroup }
            );
        } catch(err: Error | any) {
            return res.status(err.statusCode || 500).json(
                { success: false, message: err.message || "Internal Server Error" }
            );
        }
    }

    async updateUser(req: Request, res: Response, next: NextFunction) {
        try{
            const userId = req.params.id;
            const parsedData = UpdateUserDto.safeParse(req.body);
            if(!parsedData.success) {
                return res.status(400).json({
                    success: false, errors: z.prettifyError(parsedData.error)
                });
            }
            if(req.file) {
                parsedData.data.profilePicture = `/uploads/${req.file.filename}`;
            }
            const updatedUser = await adminService.updateUser(userId, parsedData.data);
            return res.status(200).json(
                { success: true, data: updatedUser, message: "User updated successfully"}
            );
        } catch (err: Error | any) {
            return res.status(err.statusCode || 500).json(
                { success: false, message: err.message || "Internal server error"}
            );
        }
    }

    async deleteUser(req: Request, res: Response) {
        try{
            const userId = req.params.id;
            const deletedUser = await adminService.deleteUser(userId);
            if (!deletedUser) {
                return res.status(404).json(
                    { success: false, message: "User not found" }
                );
            }
            return res.status(200).json(
                { success: true, message: "User deleted successfully"}
            );
        } catch (err: Error | any) {
            return res.status(err.statusCode || 500).json(
                { success: false, message: err.message || "Internal server error"}
            );
        }
    }

    async getAllUsers(req: Request, res: Response) {
        try {
            const users = await adminService.getAllUsers();
            return res.status(200).json(
                { success: true, data: users, message: "Fetched all users successfully"}
            );
        } catch (err: Error | any) {
            return res.status(err.statusCode || 500).json(
                { success: false, message: err.message || "Internal server error"}
            );
        }
    }

    async getUserById(req: Request, res: Response) {
        try {
            const userId = req.params.id;
            const user = await adminService.getUserById(userId);
            return res.status(200).json(
                { success: true, data: user, message: "Fetched single user successfully" }
            );
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }
}