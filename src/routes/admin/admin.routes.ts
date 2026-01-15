import { Router } from "express";
import { AdminUserController } from "../../controllers/admin/admin.controller";
import { adminOnlyMiddleware, authorizedMiddleware } from "../../middlewares/authorization.middleware";

let adminUserController = new AdminUserController();
const router = Router();

router.post('/bloodGroups/create', authorizedMiddleware, adminOnlyMiddleware, adminUserController.createBloodGroup);
router.get('/bloodGroups/', authorizedMiddleware, adminOnlyMiddleware, adminUserController.getAllBloodGroups);

export default router;