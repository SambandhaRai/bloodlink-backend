import { RequestController } from "../controllers/request.controller";
import { authorizedMiddleware } from "../middlewares/authorization.middleware";
import { Router } from "express";

const router = Router();
let requestController = new RequestController();

router.post("/", authorizedMiddleware, requestController.createRequest);
router.get("/", authorizedMiddleware, requestController.getAllRequests);
router.get("/:id", authorizedMiddleware, requestController.getRequestById);

router.patch("/:id/accept", authorizedMiddleware, requestController.acceptRequest);

export default router;