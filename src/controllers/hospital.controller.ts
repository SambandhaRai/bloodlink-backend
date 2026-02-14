import { CreateHospitalDto, UpdateHospitalDto } from "../dtos/hospital.dto";
import { HospitalService } from "../services/hospital.service";
import { Request, Response } from "express";
import z from "zod";

interface QueryParams {
    page?: string,
    size?: string, 
    search?: string,
    isActive?: string;
};

let hospitalService = new HospitalService();

export class HospitalController {

    async getHospitalById(req: Request, res: Response) {
        try {
            const hospitalId = req.params.id;
            const hospital = await hospitalService.getHospitalById(hospitalId);
            return res.status(200).json(
                { success: true, data: hospital, message: "Fetched Hospital Successfully" }
            );
        } catch (err: Error | any) {
            return res.status(err.statusCode || 500).json(
                { success: false, message: err.message || "Internal Server Error" }
            );
        }
    }

    async getAllHospitals(req: Request, res: Response) {
        try {
            const { page, size, search, isActive }: QueryParams = req.query;
            const { hospitals, pagination } = await hospitalService.getAllHospitals({
                page: page,
                size: size,
                search: search,
                isActive: isActive
            });
            return res.status(200).json(
                { success: true, data: hospitals, pagination: pagination, message: "Fetched all Hospitals successfully"}
            );
        } catch (err: Error | any) {
            return res.status(err.statusCode || 500).json(
                { success: false, message: err.message || "Internal server error"}
            );
        }
    }
}
