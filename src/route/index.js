import { Router } from "express";
import userRoute from './userRoute.js'
import paymentRoute from './paymentRoute.js'
import subscriptionRoute from './subscription.js'


const router = Router();

router.use('/user', userRoute );
router.use('/payment', paymentRoute);
router.use('/subscription', subscriptionRoute);



export default router;