import { Router } from "express";
import { myEmail, sendEmail } from "../controller/EmailController.js";

const router = Router();
router.post('/send', sendEmail);
router.get('/:email', myEmail)
export default router;