import { Router } from "express";
import { getUser, login, userRegister } from "../controller/UserController.js";

const router = Router();
router.post('/register', userRegister);
router.post('/login', login)
router.get('/getUser/:email', getUser)
router.get('/test', async(req, res)=>{
    res.status(200).json({
        message:"PRTK TAI MC"
    })
})




export default router;