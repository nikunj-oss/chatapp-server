import jwt from "jsonwebtoken";
import { ErrorHandler } from "../utils/utility.js";
import {adminSecretKey} from "../app.js"
import { TryCatch } from "./error.js";
import { SYNC_TOKEN } from "../constants/config.js";
import { User } from "../models/user.js";

const isAuthenticated= TryCatch((req,res,next)=>{
    const token=req.cookies[SYNC_TOKEN]
    if(!token){
        return next(new ErrorHandler("Not Authorized Pls login to access this route",401))
    }

    const decodedData=jwt.verify(token,process.env.JWT_SECRET)
    req.user=decodedData._id
    next()
 }
 )
const adminOnly= (req,res,next)=>{
    const token=req.cookies["sync-admin-token"]
    if(!token){
        return next(new ErrorHandler("Not Authorized As Admin Pls login as Admin to access this route",401))
    }
    const secretKey=jwt.verify(token,process.env.JWT_SECRET)

    const isMatch=secretKey===adminSecretKey;

    if(!isMatch){
        return next(new ErrorHandler("Invalid admin key",401))
    }
 
    next()
 }

 const socketAuthenticator= async (err,socket,next)=>{
    try{
        if(err){
            return next(err)
        }
        const authTokens=socket.request.cookies[SYNC_TOKEN]
        if(!authTokens){
            return next(new ErrorHandler("Please Login To access this",401))
        }
        const decodedData=jwt.verify(authTokens,process.env.JWT_SECRET)

        const user=await User.findById(decodedData._id)
        if(!user){
            return next(new ErrorHandler("User not found",404))
        }
        socket.user=user
        return next()

    }
    catch(e){
        console.log(err)
        return next(new ErrorHandler("Please Login To access this",401))
    }
 }
 
export {isAuthenticated,adminOnly,socketAuthenticator}