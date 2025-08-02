import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"


import {uploadOnCloudinary} from "../utils/cloudinary.js"

const getAllVideosByOwner = async (req, res) => {
  try {
    const { ownerId } = req.params;

    if (!ownerId || !isValidObjectId(ownerId)) {
      return res.status(400).json({ message: "Invalid owner id" });
    }

    const videos = await Video.find({ owner: ownerId, isPublished: true });

    return res.status(200).json({
      success: true,
      data: videos,
      message: "Videos fetched successfully"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};
const publishAVideo = async (req, res) => {
    try{
    const { title, description} = req.body
    console.log(title)

      if (
        [title,description].some((field) => field?.trim() === "")
    ) {
       return res.status(400).json({
        message:"All fields are required"
       })
    }
     const videoFileLocalPath = req.files?.videoFile[0]?.path;
     
     console.log(videoFileLocalPath)
        if (!videoFileLocalPath) {
       return res.status(401).json({
        message:"videFile required"
       })
    }
     const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
       if (!thumbnailLocalPath ) {
       return res.status(401).json({
        message:"Thumbnail required"
       })
    }
    const videoFile =await uploadOnCloudinary(videoFileLocalPath )
    console.log(videoFile.url)
     
       
        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
        console.log(thumbnail.url)
         if (!videoFile|| !thumbnail) {
        return  res.status(401).json({
        message:"thumbnail and videoFile are required"
       })
    }
    
    
        const video = await Video.create({
            title,
            description,
            videoFile:videoFile?.url,
            thumbnail:thumbnail?.url,
            duration:videoFile?.duration,
            views:0,
            isPublished:true,
            owner:req.user?._id
        })
        console.log(video)
         return res.status(200).json({
            video,
            message:"video publish created succesfully"
        })
    }
    catch(error){
    return res.status(400)
        .json(
            {message:"something went wrong"}
        );
    }
     
    // TODO: get video, upload to cloudinary, create video
}
const getVideoById = async (req, res) => {
    try{
    const { id } = req.params
     if(!id){ 
        return res.status(400).send("id not exist")
     } 
  
    const video=await Video.findById(id)
    
    if(!video){
        return res.status(400).send("video not exist")
    }
    
    return res.status(200).json({
        video,
        message:"video found successfully"
    })
    //TODO: get video by id
}
catch(error){
  return res.status(401).send("something went wrong")
}
}
const updateVideo = async (req, res) => {
  try {
    const { id} = req.params;
   
    if(!id){ 
        return res.status(400).send("id not exist")
     } 
    const video=await Video.findById(id)
    

    if (!video) {
      return res.status(400).send("video does not exist");
    }

    if (req.user?._id != video.owner.toString()) {
      return res.status(403).send("unauthorized user");
    }

    const { title, description } = req.body;

    if ([title, description].some((field) => !field || field.trim() === "")) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
    console.log(thumbnailLocalPath)
    if (!thumbnailLocalPath) {
      return res.status(400).json({
        message: "Thumbnail required"
      });
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if (!thumbnail) {
      return res.status(400).json({
        message: "thumbnail upload failed"
      });
    }

    const updatedVideo = await Video.findByIdAndUpdate(
      id,
      {
        $set: {
          title,
          description,
          thumbnail: thumbnail.url
        }
      },
      { new: true }
    );

    return res.status(200).json({ video: updatedVideo, message: "video updated successfully" });

  } catch (error) {
    console.error(error);
    return res.status(500).send("Something went wrong");
  }
};
const deleteVideo = async (req, res) => {
  try{
   const { id} = req.params;
   
    if(!id){ 
        return res.status(400).send("id not exist")
     } 
    const video=await Video.findById(id)
    

    if (!video) {
      return res.status(400).send("video does not exist");
    }

    if (req.user?._id != video.owner.toString()) {
      return res.status(403).send("unauthorized user");
    }
     await Video.findByIdAndDelete(id);
     return res.status(200).send("video deleted successfully");
   
}
catch(error){
  return res.status(400).send("Something went wrong")
}
}


export {
   
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    getAllVideosByOwner
  
}