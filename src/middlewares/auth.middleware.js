
import jwt from "jsonwebtoken"
import { User } from "../models/user.models.js"

export const verifyJWT = async(req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        
        // console.log(token);
        if (!token) {
             return res.status(401).json({
                message:"Unauthorized request"
            })
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if (!user) {
            
             return res.status(401).json({
                message:"Invalid Access Token"
            })
        }
    
        req.user = user;
        next()
    } catch (error) {
         return res.status(400).json({message:error})
    }
    
}


































