import { Router } from "express";
import { AdminUserController } from "../../controllers/admin/admin.controller";
import { adminOnlyMiddleware, authorizedMiddleware } from "../../middlewares/authorization.middleware";
import { uploads } from "../../middlewares/upload.middleware";

let adminUserController = new AdminUserController();
const router = Router();

router.use(authorizedMiddleware);
router.use(adminOnlyMiddleware);

router.post('/bloodGroups/create', adminUserController.createBloodGroup);

router.get('/users', adminUserController.getAllUsers);
router.get('/users/:id', adminUserController.getUserById);
router.put('/users/:id', uploads.single('profilePicture'), adminUserController.updateUser);
router.delete('/users/:id', adminUserController.deleteUser);

export default router;