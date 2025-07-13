
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
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

export {registerUser}