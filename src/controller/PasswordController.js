import User from "../models/UserModel.js";
import bcrypt from 'bcrypt'

export const ChangePassword = async(req, res)=>{
    try {
        const {email, oldPassword, newPassword}  = req.body;
        const isExist = await User.findOne({email:email});
        if(!isExist){
            res.status(401).json({
                message:"User not found"
            });



        }

        const compare = await bcrypt.compare(oldPassword, isExist.password);
        if(!compare){
            res.status(401).json({
                message:"Wrong password"
            })
        }
        
const hasPassword = await bcrypt.hash(newPassword, 10);

const updatedPassword = await User.updateOne({password: hasPassword});
res.status(200).json({
    message:"Success",
    data: updatedPassword
})

    } catch (error) {
        res.status(500).json({
            error,
            message:error.message
        })
    }
}