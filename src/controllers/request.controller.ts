import { RequestService } from "../services/request.service";
import { Request, Response} from "express";
import z from "zod";

interface QueryParams {
    page?: string;
    size?: string;
    search?: string;
}

let requestService = new RequestService();

export class RequestController {
    async createRequest(req: Request, res: Response) {
        try{
            const userId = req.user?._id;
            const newRequest = await requestService.createRequest(req.body, String(userId));
            return res.status(201).json(
                { success: true, data: newRequest, message: "Request Successfully Made" }
            )
        } catch(err: Error | any) {
            return res.status(err.statusCode || 500).json(
                { success: false, message: err.message || "Internal Server Error" }
            );
        }
    } 

    async getAllRequests(req: Request, res: Response) {
        try {
            const { page, size, search }: QueryParams = req.query;
            const { requests, pagination } = await requestService.getAllRequests({
                page: page,
                size: size,
                search: search
            });
            return res.status(200).json(
                { success: true, data: requests, pagination: pagination, message: "Requests Fetched Successfully" }
            );
        } catch (err: Error | any) {
            return res.status(err.statusCode || 500).json(
                { success: false, message: err.message || "Internal Server Error" }
            );
        }
    }
}