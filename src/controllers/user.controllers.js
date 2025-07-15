
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
         res.status(409).json({
        message:"user with username or email already exist"
       })
    }
    console.log(req.files);

    const avatarLocalPath = req.files?.avatar[0]?.path;
    console.log(avatarLocalPath)
    let coverImageLocalPath 
    

   if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
    coverImageLocalPath = req.files.coverImage[0].path
   }
    

    if (!avatarLocalPath) {
       res.status(401).json({
        message:"avatar file required"
       })
    }

    const avatar =await uploadOnCloudinary(avatarLocalPath)
    console.log(avatar)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    console.log(coverImage)

    if (!avatar) {
         res.status(401).json({
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
         res.status(500).json({
        message:"Something went wrong while registering the user"
       })
    }

      
        res.status(200).json({
            message:"user created succesfully"
        })
    
       

      
   }
   catch(error){
    console.log(error)
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
        $set: {
            refreshToken: undefined
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

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}














