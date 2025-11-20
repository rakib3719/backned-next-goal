import { Router } from "express";
import { cancelSubscriptionByEmail, mySubscriptions } from "../controller/SubscriptionController.js";

const router = Router();

router.get('/my-subscripton/:email', mySubscriptions);
router.post('/cancel-subscription', cancelSubscriptionByEmail);
router.put('/cancel-subscription', cancelSubscriptionByEmail );
export default router;