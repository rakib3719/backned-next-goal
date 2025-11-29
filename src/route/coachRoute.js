import { Router } from "express";
import { deleteCoach, editCoach, getAllCoach, saveCoach } from "../controller/CoachController.js";

const router = Router();

router.post('/', saveCoach);
router.get('/', getAllCoach)
router.put('/edit/:id', editCoach);
router.delete('/delete/:id', deleteCoach)
export default router;