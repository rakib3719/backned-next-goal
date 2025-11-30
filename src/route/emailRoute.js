import { Router } from "express";
import { checkLimit, myEmail, sendEmail } from "../controller/EmailController.js";

const router = Router();
router.post('/send', sendEmail);
router.get('/checkLimit/:email', checkLimit)
router.get('/:email', myEmail)
export default router;