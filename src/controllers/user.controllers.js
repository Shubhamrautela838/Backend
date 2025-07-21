
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import jwt from "jsonwebtoken"



const getAccessTokenAndRefreshToken = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        return res.status(500).json({message: "Something went wrong while generating referesh and access token"})
    }
}
const registerUser= async(req,res)=> {
   try{
      const {fullName, email, username, password } = req.body
    console.log("email: ", email);
    

    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
       res.status(400).json({
        message:"All fields are required"
       })
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
     

    if (existedUser) {
        return  res.status(409).json({
        message:"user with username or email already exist"
       })
    }
   

    const avatarLocalPath = req.files?.avatar[0]?.path;
     console.log(avatarLocalPath)
    let coverImageLocalPath 
    

   if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
    coverImageLocalPath = req.files.coverImage[0].path
   }
   console.log(coverImageLocalPath)
    

    if (!avatarLocalPath) {
       return res.status(401).json({
        message:"avatar file required"
       })
    }

    const avatar =await uploadOnCloudinary(avatarLocalPath)
 
   
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    
     console.log(coverImage)
    if (!avatar) {
        return  res.status(401).json({
        message:"avatar files required"
       })
    }
   

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })
   

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
  

    if (!createdUser) {
         return res.status(500).json({
        message:"Something went wrong while registering the user"
       })
    }

      
        return res.status(200).json({
            message:"user created succesfully"
        })
    
       

      
   }
   catch(error){
    
        res.status(400)
        .json(
            {message:"something went wrong"}
        );
       
        
   }

};

const loginUser = async (req, res) =>{
    try{
   

    const {email, username, password} = req.body
    

    if (!username && !email) {
         return res.status(400).json({message:"username or email are required"})
    }
    
    

    const user = await User.findOne({
        $or: [{username}, {email}]
    })
  

    if (!user) {
        res.status(400).json({message:"user not found"})
    }

   const isPasswordValid = await user.isPasswordCorrect(password)
   

   if (!isPasswordValid) {
     return res.status(400).json({message:"password is incorrect"})
    }

   const {accessToken, refreshToken} = await getAccessTokenAndRefreshToken(user._id)
  

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    console.log(loggedInUser)

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
   .json({
        accessToken,
        refreshToken,
        loggedInUser,
        message:"user successfully loggedIn"
     })

    }catch(error) {
        return res.status(400).json({
            message:"unsuccessfull login"
        })
    }
   }

const logoutUser =async(req,res)=> {
  await User.findByIdAndUpdate(
    req.user._id,
    {
        $unset: {
            refreshToken: 1
        }
    },
    {
        new:true
    }
    
  )
    const options={
        httpOnly:true,
        secure:true

     }
     return res.status(200)
     .clearCookie("accessToken",options)
     .clearCookie("refreshToken",options)
     .json({
        message:"user logged out successfully"
     })
}

const refreshAccessToken =async(req,res)=> {
  try {
      const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken

      if(!incomingRefreshToken){
        return res.status(401).json({message:"unauthorized user"})
      }

      const  decodedToken= jwt.verify(incomingRefreshToken,REFRESH_TOKEN_SECRET)
      const user=await User.findOne(decodedToken?._id)
      if(!user){
        return res.status(401).json({
            message:"Invalid refresh token"
        })
      }

      if(incomingRefreshToken!==user?.refreshToken){
         return res.status(401).json({
            message:"refresh token is expired or used"
        })
      }

      const {accessToken,newRefreshToken}=await getAccessTokenAndRefreshToken()
       
       const options = {
            httpOnly: true,
            secure: true
        }

          return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json({
            accessToken,
            refreshToken:newRefreshToken,
            message:"access token refresh successfully"
        })
      
  } catch (error) {
     res.status(401).json({
        message:"Something went Wrong"
     })
  }
}

const changeCurrentPassword= async(req,res)=> {
    try{
       const {oldPassword,newPassword}=req.body;
       const user=await User.findOne(req.user?._id)
       const isPasswordCorrect=await user.isPasswordCorrect(oldPassword)
       if(!isPasswordCorrect){
        return res.status(400).send("Invalid old Password")
       }
       user.password=newPassword;
       await user.save({validateBeforeSave:false})

       return res.status(200).send("Password changed successfully")
    }
    catch(error){
        return res.status(402).send("something went wrong")
    }
}
const getCurrentUser=async(req,res)=> {
    return res.status(200).json({user:req.user,message:"current user fetcheded successfully"})
}
const updateAccountDetails=async(req,res)=> {
    try{
    const {email,fullName}=req.body;
    if(!fullName || !email){
        return res.status(400).send("All fields arev required")
    }
    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
           $set: { email,
            fullName}
        },
        {new:true}

    ).select("-password")

    return res.status(200).json({user,message:"Account details updated successfully"})

}
catch(error){
   return res.status(400).send("something went wrong")
}
}
const updateUserAvatar=async(req,res)=> {
    try {
        const avatarLocalPath=req.file?.path
        if(!avatarLocalPath){
            return res.status(400).send("Avatar file is missing")
        }
        const avatar=await uploadOnCloudinary(avatarLocalPath)
        if(!avatar.url){
            return res.status(400).send("Error while uploading on avatar")
        }

        const user=await User.findByIdAndUpdate(
            req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true}
    ).select("-password")

    return res.status(200).json({user,message:"avatar file updated successfully"})

    } catch (error) {
        return res.status(401).send("Something Went Wrong")
    }
}
const updateUserCoverImage=async(req,res)=>{
    try {
        const CoverImageLocalPath=req.file?.path
        if(!CoverImageLocalPath){
            return res.status(400).send("CoverImage file is missing")
        }
        const CoverImage=await uploadOnCloudinary(CoverImageLocalPath)
        if(!CoverImage.url){
            return res.status(400).send("Error while uploading on CoverImage")
        }

        const user=await User.findByIdAndUpdate(
            req.user?._id,
        {
            $set:{
                CoverImage:CoverImage.url
            }
        },
        {new:true}
    ).select("-password")
          return res.status(200).json({user,message:"coverImage updated successfully"})

    } catch (error) {
        return res.status(401).send("Something Went Wrong")
    }
}

const getUserChannelProfile =async(req,res)=> {
try {
    const {username}=req.params
    if(!username?.trim()){
     return res(400).send("username is missing")
    }

    const channel=User.aggregate([
       {
        $match:{
            username:username?.toLowerCase()
        }
       },
       {
       $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"channel",
        as:"subscribers"

       
       }
    },
      {
       $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"subscriber",
        as:"subscribedTo"

       
       }
    },
     {
        $addFields:{
            subscribersCount:{
                $size:"$subscribers"
            },
             channelsSubscribedToCount:{
                $size:"$subscribedTo"
            },
            isSubscribed:{
                $cond:{
                    if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                    then:true,
                    else:false
                }
            }
        }
     },
     {
        $project:{
            fullName:1,
            username:1,
            subscribersCount:1,
            channelsSubscribedToCount:1,
             isSubscribed:1,
             avatar:1,
             coverImage:1,
             email:1

        }
     }
    ])
    if(!channel?.length){
        return res.status(404).send("channel does not exist")
    }
    return res.status(200).send({
        channel:channel[0],
        message:"user channel fetched successfully"

    })

} catch (error) {
    return res.status(404).send("Something went wrong")   
}
}
const getWatchHistory=async(req,res)=> {
    try {
        console.log("hii")
         const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])
    console.log(user)
    return res.status(200).json({
        user:user[0].watchHistory,
        message:"success"
    })
    } catch (error) {
        return res.status(400).send("something went wrong")
    }
}


export {
    
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
     getCurrentUser,
     updateAccountDetails,
     updateUserAvatar,
     updateUserCoverImage,
     getUserChannelProfile,
     getWatchHistory
}














