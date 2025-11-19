import { Router } from "express";
import userRoute from './userRoute.js'
import paymentRoute from './paymentRoute.js'


const router = Router();

router.use('/user', userRoute );
router.use('/payment', paymentRoute);



export default router;