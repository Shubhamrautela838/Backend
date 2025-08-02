import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"



const createTweet = async (req, res) => {
    const {content} = req.body
    if (!content) throw new Error( "Tweet content required")
    const tweet = await Tweet.create({ owner: req.user._id, content })
    return res.status(201).send(tweet, "Tweet created")
}

const getUserTweets = async (req, res) => {
    const {userId} = req.params
    if (!isValidObjectId(userId)) throw new Error("Invalid userId")
    const tweets = await Tweet.find({ owner: userId })
    return res.status(200).json(tweets, "User tweets")
}

const updateTweet = async (req, res) => {
    const {tweetId} = req.params
    const {content} = req.body
    const tweet = await Tweet.findOneAndUpdate(
        { _id: tweetId, owner: req.user._id },
       { $set:{ content }},
        { new: true }
    );
    if (!tweet) return res.status(400).send( "Tweet not found or unauthorized")
    return res.status(200).json(tweet, "Tweet updated")
}

const deleteTweet = async (req, res) => {
    const {tweetId} = req.params
    const tweet = await Tweet.findOneAndDelete({ _id: tweetId, owner: req.user._id })
    if (!tweet) return res.status(400).send("Tweet not found or unauthorized")
    return res.status(200).send("Tweet deleted")
}

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}