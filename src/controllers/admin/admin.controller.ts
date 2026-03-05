import { CreateBloodGroupDto } from "../../dtos/blood.dto";
import { CreateHospitalDto, UpdateHospitalDto } from "../../dtos/hospital.dto";
import { UpdateUserDto } from "../../dtos/user.dto";
import { AdminService } from "../../services/admin/admin.service";
import { NextFunction, Request, Response } from "express";
import z from "zod";

interface QueryParams {
    page?: string,
    size?: string;
    search?: string;
}

let adminService = new AdminService();

export class AdminUserController {
    async createBloodGroup(req: Request, res: Response) {
        try {
            const parsedData = CreateBloodGroupDto.safeParse(req.body);
            if (!parsedData.success) {
                return res.status(400).json(
                    { success: false, errors: z.prettifyError(parsedData.error) }
                );
            }
            const newBloodGroup = await adminService.createBloodGroup(parsedData.data);
            return res.status(201).json(
                { success: true, data: newBloodGroup }
            );
        } catch (err: Error | any) {
            return res.status(err.statusCode || 500).json(
                { success: false, message: err.message || "Internal Server Error" }
            );
        }
    }

    async addHospital(req: Request, res: Response) {
        try {
            const parsedData = CreateHospitalDto.safeParse(req.body);
            if (!parsedData.success) {
                return res.status(400).json(
                    { success: false, errors: z.prettifyError(parsedData.error) }
                )
            }
            const newHospital = await adminService.addHospital(parsedData.data);
            return res.status(201).json(
                { success: true, data: newHospital, message: "Hospital created successfully" }
            );
        } catch (err: Error | any) {
            return res.status(err.statusCode || 500).json(
                { success: false, message: err.message || "Internal Server Error" }
            );
        }
    }

    async updateHospital(req: Request, res: Response) {
        try {
            const hospitalId = req.params.id;
            const parsedData = UpdateHospitalDto.safeParse(req.body);
            if (!parsedData.success) {
                return res.status(400).json(
                    { success: false, errors: z.prettifyError(parsedData.error), }
                );
            }
            const updatedhospital = await adminService.updateHospital(hospitalId, parsedData.data);
            return res.status(200).json(
                { success: true, data: updatedhospital, message: "Hospital updated successfully", }
            );
        } catch (err: Error | any) {
            return res.status(err.statusCode || 500).json(
                { success: false, message: err.message || "Internal Server Error" }
            );
        }
    }

    async deleteHospital(req: Request, res: Response) {
        try {
            const hospitalId = req.params.id;
            const deletedHospital = await adminService.deleteHospital(hospitalId);
            if (!deletedHospital) {
                return res.status(404).json(
                    { success: false, message: "Hospital not found" }
                );
            }
            return res.status(200).json(
                { success: true, message: "Hospital Deleted Successfully" }
            );
        } catch (err: Error | any) {
            return res.status(err.statusCode || 500).json(
                { success: false, message: err.message || "Internal Server Error" }
            );
        }
    }


    async updateUser(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.params.id;
            const parsedData = UpdateUserDto.safeParse(req.body);
            if (!parsedData.success) {
                return res.status(400).json({
                    success: false, errors: z.prettifyError(parsedData.error)
                });
            }
            if (req.file) {
                parsedData.data.profilePicture = `/uploads/${req.file.filename}`;
            }
            const updatedUser = await adminService.updateUser(userId, parsedData.data);
            return res.status(200).json(
                { success: true, data: updatedUser, message: "User updated successfully" }
            );
        } catch (err: Error | any) {
            return res.status(err.statusCode || 500).json(
                { success: false, message: err.message || "Internal server error" }
            );
        }
    }

    async deleteUser(req: Request, res: Response) {
        try {
            const userId = req.params.id;
            const deletedUser = await adminService.deleteUser(userId);
            if (!deletedUser) {
                return res.status(404).json(
                    { success: false, message: "User not found" }
                );
            }
            return res.status(200).json(
                { success: true, message: "User deleted successfully" }
            );
        } catch (err: Error | any) {
            return res.status(err.statusCode || 500).json(
                { success: false, message: err.message || "Internal server error" }
            );
        }
    }

    async getAllUsers(req: Request, res: Response) {
        try {
            const { page, size, search }: QueryParams = req.query;
            const { users, pagination } = await adminService.getAllUsers({
                page: page,
                size: size,
                search: search
            });
            return res.status(200).json(
                { success: true, data: users, pagination: pagination, message: "Fetched all users successfully" }
            );
        } catch (err: Error | any) {
            return res.status(err.statusCode || 500).json(
                { success: false, message: err.message || "Internal server error" }
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

    async getUserHistoryAdmin(req: Request, res: Response) {
        const userId = req.params.id;

        const data = await adminService.getUserHistoryAdmin(userId);

        return res.status(200).json({
            success: true,
            message: "Fetched user request history successfully",
            data,
        });
    };

    async getRequestStats(req: Request, res: Response) {
        try {
            const stats = await adminService.getRequestStatsAdmin();

            return res.status(200).json({
                success: true,
                message: "Fetched request stats successfully",
                data: stats,
            });
        } catch (err: Error | any) {
            return res.status(err.statusCode || 500).json({
                success: false,
                message: err.message || "Internal server error",
            });
        }
    }
}