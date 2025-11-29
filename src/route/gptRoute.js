import { Router } from "express";
import {  emailGeneration } from "../controller/GptController.js";

const router = Router();

router.post('/generate-email', emailGeneration);


export default router;