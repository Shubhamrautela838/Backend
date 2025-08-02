import { Router } from 'express';
import {
   
    getVideoById,
    publishAVideo,
   updateVideo,deleteVideo,
   getAllVideosByOwner
  
} from "../controllers/video.controllers.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"
import {upload} from "../middlewares/multer.middlewares.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
    .route("/publish")
    .post(verifyJWT,
        upload.fields([
            {
                name: "videoFile",
                maxCount: 1,
            },
            {
                name: "thumbnail",
                maxCount: 1,
            },
            
        ]),
        publishAVideo
    );
    router.route("/getvideo/:id").get(getVideoById)
    router.route("/updateVideo/:id").patch(verifyJWT,upload.fields( [{
                name: "thumbnail",
                maxCount: 1,
            }]),updateVideo);
    router.route("/deletevideo/:id").delete(verifyJWT,deleteVideo);
    router.route("/owner/:ownerId").get(getAllVideosByOwner);





export default router