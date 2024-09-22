import mongoose from "mongoose";
import jwt from "jsonwebtoken"
import {v2 as cloudinary} from "cloudinary"
import { v4 as uuid} from "uuid";
import { getBase64, getSockets } from "../lib/helper.js";
const cookieOptions={
        httpOnly:true,
        maxAge:1000*60*60*24*15,
        sameSite:process.env.NODE_ENV==="PRODUCTION"?"none":"",
        secure:process.env.NODE_ENV==="PRODUCTION"
}

const connectDB = (uri) => {
    mongoose.connect(uri, { dbName: "Sync" })
        .then((data) => console.log(`Connected to DB ${data.connection.host}`))
        .catch((err) => { throw err });
};

const sendToken=(res,user,code,message)=>{
    const token=jwt.sign({_id:user._id},process.env.JWT_SECRET)

    return res.status(code).cookie("sync-token",token,cookieOptions).json({
        success:true,user,
        message,
        
    })
}

const emitEvent=(req,event,users,data)=>{
    const io=req.app.get("io");
    const userSocket=getSockets(users)
    io.to(userSocket).emit(event,data)
}

const uploadFilesToCloudinary=async (files=[])=>{
    const uploadPromises=files.map((file)=>{
        return new Promise((resolve,reject)=>{
            cloudinary.uploader.upload(getBase64(file),{
                resource_type:"auto",
                public_id:uuid(),

            },(error,result)=>{
                if(error){
                    reject(error)
                }
                resolve(result)
            })
        })
    })
    try{
        const results=await Promise.all(uploadPromises)
        const formattedResults=results.map((result)=>(
            {
                public_id:result.public_id,
                url:result.secure_url
            }
        ))
        return formattedResults;
    }
    catch(err){
        throw new Error("Error uploading files to cloudinary",err)
    }
}

const deleteFilesFromCloudinary=async (public_ids)=>{

}


export { connectDB,sendToken,cookieOptions,emitEvent,deleteFilesFromCloudinary,uploadFilesToCloudinary};
