import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";

const createPlaylist = async (req, res) => {
    try{
    const { name, description } = req.body;
    const userId = req.user?._id;
    console.log(name)

    if (!name) {
        throw new ApiError(400, "Playlist name is required");
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: userId,
        videos: []
    });

    return res.status(201).json({playlist,message:"playlist created successfully"})
}
catch(error){
    return res.status(400).send("Something went wrong")
}
}

const getUserPlaylists = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!isValidObjectId(userId)) {
            return res.status(400).send( "Invalid user ID");
        }

        const playlists = await Playlist.find({ owner: userId });
       

        return res.status(200).send({playlists,message:"User playlists fetched successfully"});
    } catch (error) {
        return res.status(500).send(error.message);
    }
};

// Get a playlist by ID
const getPlaylistById = async (req, res) => {
    try {
        const { playlistId } = req.params;

        if (!isValidObjectId(playlistId)) {
            return res.status(400).send("Invalid playlist ID");
        }

        const playlist = await Playlist.findById(playlistId).populate("videos");
        if (!playlist) {
            return res.status(404).send("Playlist not found");
        }

        return res.status(200).send(playlist,"Playlist fetched successfully");
    } catch (error) {
        return res.status(500).send( error.message);
    }
};

// Add a video to a playlist
const addVideoToPlaylist = async (req, res) => {
    try {
        const { playlistId, videoId } = req.params;

        if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
            return res.status(400).send("Invalid playlist or video ID");
        }

        const playlist = await Playlist.findById(playlistId);
        if (!playlist) {
            return res.status(404).send("Playlist not found");
        }

        const video = await Video.findById(videoId);
        if (!video) {
            return res.status(404).send("Video not found");
        }

        if (playlist.videos.includes(videoId)) {
            return res.status(400).send("Video already in playlist");
        }

        playlist.videos.push(videoId);
        await playlist.save();

        return res.status(200).send(playlist, "Video added to playlist");
    } catch (error) {
        return res.status(500).send(error.message);
    }
};

// Remove a video from a playlist
const removeVideoFromPlaylist = async (req, res) => {
    try {
        const { playlistId, videoId } = req.params;

        if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
            return res.status(400).send("Invalid playlist or video ID");
        }

        const playlist = await Playlist.findById(playlistId);
        if (!playlist) {
            return res.status(404).send("Playlist not found");
        }

        playlist.videos = playlist.videos.filter(id => id.toString() !== videoId);
        await playlist.save();

        return res.status(200).send( playlist, "Video removed from playlist");
    } catch (error) {
        return res.status(500).send(error.message);
    }
};

// Delete a playlist
const deletePlaylist = async (req, res) => {
    try {
        const { playlistId } = req.params;

        if (!isValidObjectId(playlistId)) {
            return res.status(400).send("Invalid playlist ID");
        }

        const playlist = await Playlist.findById(playlistId);

        if (!playlist) {
            return res.status(404).send("Playlist not found");
        }
       const deletedplaylist = await Playlist.findByIdAndDelete(playlistId);
        return res.status(200).send("Playlist deleted successfully");
    } catch (error) {
        return res.status(500).send(error.message);
    }
};


const updatePlaylist = async (req, res) => {
    try {
        const { playlistId } = req.params;
        const { name,description } = req.body;

        if (!isValidObjectId(playlistId)) {
            return res.status(400).send( "Invalid playlist ID");
        }

        const playlist = await Playlist.findById(playlistId);
        if (!playlist) {
            return res.status(404).send("Playlist not found");
        }
 const updatedplaylist = await Playlist.findByIdAndUpdate(playlistId,
    {
      $set:{ name :name,
       description: description}
    },{new:true}
 );
        

       

        return res.status(200).send(updatedplaylist,"Playlist updated successfully");
    } catch (error) {
        return res.status(500).send(error.message);
    }
};

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
};




