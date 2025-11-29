import { Router } from "express";
import { allUser, getUser, login, userRegister } from "../controller/UserController.js";
import { checkPremium } from "../controller/SubscriptionController.js";

const router = Router();
router.post('/register', userRegister);
router.post('/login', login)
router.get('/getUser/:email', getUser);
router.get('/isPremium/:email', checkPremium)


router.get('/allUser', allUser)



export default router;