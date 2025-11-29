import { Router } from "express";
import { allSubscriptions, cancelSubscriptionByEmail, mySubscriptions } from "../controller/SubscriptionController.js";


const router = Router();

router.get('/my-subscripton/:email', mySubscriptions);
router.post('/cancel-subscription', cancelSubscriptionByEmail);
router.put('/cancel-subscription', cancelSubscriptionByEmail );
router.get('/all-subscriptions/:email', allSubscriptions);

export default router;