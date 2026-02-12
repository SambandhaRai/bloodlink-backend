import { RequestController } from "../controllers/request.controller";
import { authorizedMiddleware } from "../middlewares/authorization.middleware";
import { Router } from "express";

const router = Router();
let requestController = new RequestController();

router.post("/", authorizedMiddleware, requestController.createRequest);
router.get("/", authorizedMiddleware, requestController.getAllRequests);

export default router;