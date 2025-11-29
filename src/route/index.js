import { Router } from "express";
import userRoute from './userRoute.js'
import paymentRoute from './paymentRoute.js'
import subscriptionRoute from './subscription.js'
import gptroute from './gptRoute.js'
import templateRoute from './templateRoute.js'
import coach from './coachRoute.js'
import email from './emailRoute.js'
import password from './passwordRoute.js'


const router = Router();

router.use('/user', userRoute );
router.use('/payment', paymentRoute);
router.use('/subscription', subscriptionRoute);
router.use('/gpt', gptroute);
router.use('/template', templateRoute);
router.use('/coach', coach)
router.use('/email', email)
router.use('/password', password)

router.use('/test', async(req, res)=>{
    res.status(200).json({
        message:"API is working"
    })
})



export default router;