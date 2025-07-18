import dotenv from "dotenv";
import { app } from "./app.js";
import connectDB from "./db/index.js";

dotenv.config({
    path:'./env'
})
connectDB()
.then(()=>{
    app.listen(process.env.Port||8000,()=>{;
        console.log(`server is running at port:${process.env.Port}`)
    });
})
.catch((err)=>{
    console.log(("Mongo db connection failed !!!",err))
})