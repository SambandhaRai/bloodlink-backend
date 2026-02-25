import { RequestService } from "../services/request.service";
import { Request, Response } from "express";
import z from "zod";
import { CreateRequestDtoSchema } from "../dtos/request.dto";

interface QueryParams {
    page?: string;
    size?: string;
    search?: string;
}

let requestService = new RequestService();

export class RequestController {
    async createRequest(req: Request, res: Response) {
        try {
            const userId = req.user?._id;
            const parsedData = CreateRequestDtoSchema.safeParse(req.body);
            if (!parsedData.success) {
                return res.status(400).json(
                    { success: false, errors: z.prettifyError(parsedData.error) }
                );
            }
            const newRequest = await requestService.createRequest(parsedData.data, String(userId));
            return res.status(201).json(
                { success: true, data: newRequest, message: "Request Successfully Made" }
            )
        } catch (err: Error | any) {
            return res.status(err.statusCode || 500).json(
                { success: false, message: err.message || "Internal Server Error" }
            );
        }
    }

    async getMyHistory(req: Request, res: Response) {
        try {
            const userId = req.user?._id;
            if (!userId) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }

            const data = await requestService.getMyHistory(String(userId));
            return res.status(200).json({
                success: true,
                data,
                message: "User history fetched successfully",
            });
        } catch (err: any) {
            return res.status(err.statusCode || 500).json({
                success: false,
                message: err.message || "Internal Server Error",
            });
        }
    }

    async getAllPendingRequests(req: Request, res: Response) {
        try {
            const { page, size, search }: QueryParams = req.query;
            const { requests, pagination } = await requestService.getAllPendingRequests({
                page: page,
                size: size,
                search: search
            });
            return res.status(200).json(
                { success: true, data: requests, pagination: pagination, message: "Pending Requests Fetched Successfully" }
            );
        } catch (err: Error | any) {
            return res.status(err.statusCode || 500).json(
                { success: false, message: err.message || "Internal Server Error" }
            );
        }
    }

    async getRequestById(req: Request, res: Response) {
        try {
            const requestId = req.params.id;
            const request = await requestService.getRequestById(requestId);
            return res.status(200).json(
                { success: true, data: request, message: "Fetched single request successfully" }
            );
        } catch (err: Error | any) {
            return res.status(err.statusCode ?? 500).json(
                { success: false, message: err.message || "Internal Server Error" }
            );
        }
    }

    async acceptRequest(req: Request, res: Response) {
        try {
            const userId = req.user?._id;
            if (!userId) {
                return res.status(401).json(
                    { success: false, message: "Unauthorized" }
                );
            }
            const requestId = req.params.id;
            const updated = await requestService.acceptRequest(requestId, String(userId));
            return res.status(200).json(
                { success: true, data: updated, message: "Request accepted successfully" }
            );
        } catch (err: Error | any) {
            return res.status(err.statusCode || 500).json(
                { success: false, message: err.message || "Internal Server Error", }
            );
        }
    }

    async finishRequest(req: Request, res: Response) {
        try {
            const userId = req.user?._id;
            if (!userId) {
                return res.status(401).json(
                    { success: false, message: "Unauthorized" }
                );
            }
            const requestId = req.params.id;
            const finished = await requestService.finishRequest(requestId, String(userId));
            return res.status(200).json(
                { success: true, data: finished, message: "Request finished successfully" }
            );
        } catch (err: any) {
            return res.status(err.statusCode || 500).json(
                { success: false, message: err.message || "Internal Server Error" }
            );
        }
    }

    async getMatchedRequests(req: any, res: any) {
        try {
            const userId = req.user?._id;
            if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

            const lng = Number(req.query.lng);
            const lat = Number(req.query.lat);
            const km = req.query.km ? Number(req.query.km) : 5;

            if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
                return res.status(400).json({ success: false, message: "lng and lat are required numbers" });
            }

            const { requests, pagination } = await requestService.getMatchedRequests({
                userId: String(userId),
                lng,
                lat,
                km,
                page: req.query.page,
                size: req.query.size,
                search: req.query.search,
            });

            return res.status(200).json({ success: true, data: requests, pagination, message: "Matched requests fetched" });
        } catch (err: any) {
            return res.status(err.statusCode || 500).json({
                success: false,
                message: err.message || "Internal Server Error",
            });
        }
    }
}