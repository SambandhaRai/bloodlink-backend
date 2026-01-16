import { Request, Response } from "express";
import { BloodGroupService } from "../services/blood.service";

let bloodGroupService = new BloodGroupService();

export class BloodGroupController {
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