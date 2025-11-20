import { Router } from "express";
import { createSession } from "../controller/PaymentController.js";


const router = Router();


router.post('/createLink', createSession);



export default router;