import { Router } from "express";
import { HospitalController } from "../controllers/hospital.controller";
import { authorizedMiddleware } from "../middlewares/authorization.middleware";

let hospitalController = new HospitalController();

const router = Router();

router.get("/", authorizedMiddleware, hospitalController.getAllHospitals);
router.get("/:id", authorizedMiddleware, hospitalController.getHospitalById);

export default router;