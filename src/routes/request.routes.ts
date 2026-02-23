import { RequestController } from "../controllers/request.controller";
import { authorizedMiddleware } from "../middlewares/authorization.middleware";
import { Router } from "express";

const router = Router();
let requestController = new RequestController();

router.post("/", authorizedMiddleware, requestController.createRequest);

router.get("/user/history", authorizedMiddleware, requestController.getUserHistory);

router.get("/matched", authorizedMiddleware, requestController.getMatchedRequests);

router.get("/", authorizedMiddleware, requestController.getAllPendingRequests);
router.get("/:id", authorizedMiddleware, requestController.getRequestById);

router.patch("/:id/accept", authorizedMiddleware, requestController.acceptRequest);
router.patch("/:id/finish", authorizedMiddleware, requestController.finishRequest);

export default router;