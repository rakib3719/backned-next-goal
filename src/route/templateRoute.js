import { Router } from "express";
import { editTemplate, getMyTemplate, saveEmailTemplate, templateDelete } from "../controller/EmailTemplateController.js";

const router = Router();


router.post('/', saveEmailTemplate);
router.get('/:email', getMyTemplate);
router.put('/edit', editTemplate);
router.delete('/delete/:id', templateDelete)
export default router;