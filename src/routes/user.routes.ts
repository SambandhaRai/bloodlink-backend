import { UserController } from "../controllers/user.controller";
import { authorizedMiddleware } from "../middlewares/authorization.middleware";
import { uploads } from "../middlewares/upload.middleware";
import { Router } from "express";

const router = Router();
let userController = new UserController();

router.get("/profile", authorizedMiddleware, userController.getProfile);
router.put("/update-profile", authorizedMiddleware, uploads.single("profilePicture"), userController.updateProfile);
router.put("/profile/upload", authorizedMiddleware, uploads.single("profilePicture"), userController.uploadProfilePicture);

export default router;