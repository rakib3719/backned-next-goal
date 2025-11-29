import { Router } from "express";
import { ChangePassword } from "../controller/PasswordController.js";

const router = Router();
router.put('/change', ChangePassword);

export default router;