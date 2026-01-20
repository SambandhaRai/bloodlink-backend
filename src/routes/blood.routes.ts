import { Router } from "express";
import { BloodGroupController } from "../controllers/blood.controller";

let bloodGroupController = new BloodGroupController();
const router = Router();

router.get('/', bloodGroupController.getAllBloodGroups);
router.get('/:id', bloodGroupController.getBloodById);

export default router;