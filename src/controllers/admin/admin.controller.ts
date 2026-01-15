import { CreateBloodGroupDto } from "../../dtos/blood.dto";
import { AdminService } from "../../services/admin/admin.service";
import { Request, Response } from "express";
import z from "zod";

let bloodGroupService = new AdminService();

export class AdminUserController {
    async createBloodGroup(req: Request, res: Response) {
        try{
            const parsedData = CreateBloodGroupDto.safeParse(req.body);
            if(!parsedData.success){
                return res.status(400).json(
                    { success: false, errors: z.prettifyError(parsedData.error) }
                );
            }
            const newBloodGroup = await bloodGroupService.createBloodGroup(parsedData.data);
            return res.status(201).json(
                { success: true, data: newBloodGroup }
            );
        } catch(err: Error | any) {
            return res.status(err.statusCode || 500).json(
                { success: false, message: err.message || "Internal Server Error" }
            );
        }
    }

    async getAllBloodGroups(req: Request, res: Response) {
        try{
            const bloodGroups = await bloodGroupService.getAllBloodGroups();
            return res.status(201).json(
                { success: true, data: bloodGroups, message: "Blood Groups Fetched" }
            );
        } catch(err: Error | any) {
            return res.status(err.statusCode || 500).json(
                { success: false, message: err.message || "Internal Server Error" }
            )
        }
    }
}