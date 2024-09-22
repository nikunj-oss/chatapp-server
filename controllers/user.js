//create a new user save it to the database and save token in cookie
import { compare } from "bcrypt"
import {User} from "../models/user.js"
import {Request} from "../models/request.js"
import { cookieOptions, emitEvent, sendToken, uploadFilesToCloudinary } from "../utils/features.js"
import { TryCatch } from "../middleware/error.js"
import { ErrorHandler } from "../utils/utility.js"
import {Chat} from "../models/chat.js"
import { NEW_REQUEST, REFETCH_CHATS } from "../constants/events.js"
import {getOtherMember} from "../lib/helper.js"

const newUser=TryCatch(async (req,res,next)=>{
    const {name,username,password,bio}=req.body
    const file=req.file
    if(!file){
        return next(new ErrorHandler("Please Upload Profile Picture",400))
    }
    
    const result=await uploadFilesToCloudinary([file])

    const avatar={
        public_id:result[0].public_id,
        url:result[0].url
    }

    const user=await User.create({name,bio,username,password,avatar})

    sendToken(res,user,201,"User Created Successfully")
}  )

//login user and save token in cookie

const login=TryCatch(async (req,res,next)=>{
    const {username,password}=req.body

    const user=await User.findOne({username}).select("+password")

    if(!user){
        return next(new ErrorHandler("Invlid Username Or Password",404))
        
       
    }

    const isMatch=await compare(password,user.password)

    if(!isMatch){
        return next(new ErrorHandler("Invlid Username Or Password",404))
        
    }
    sendToken(res,user,200,`Welcome Back ${user.name}`)
})

const getMyProfile=TryCatch(async (req,res,next)=>{
    const user=await User.findById(req.user)
    if(!user){
        return next(new ErrorHandler("User Not Found",404))
    }
    res.status(200).json({
        success:true,
        user
    })
})

 
const logout=TryCatch(async (req,res)=>{
    return res.status(200).cookie("sync-token","",{...cookieOptions,maxAge:0}).json({
        success:true,
        message:"Logged Out Successfully"
    })
})



const searchUser=TryCatch(async (req,res)=>{
    const {name=""}=req.query;

    const myChats=await Chat.find({
        groupChat:false,
        members:req.user

    })
    //all users from my chat means friends or people i have chatted with and concatenated them in a single array
    const allUsersFromMyChats=myChats.flatMap((chat)=>chat.members)

    //find all users from database except me and friends
    const allUsersExceptMeAndFriends=await User.find({
        _id:{
            $nin:[...allUsersFromMyChats,req.user]
        },
        name:{
            $regex: name,
            $options:"i"
        }
    })
    //modifying the response
    const users=allUsersExceptMeAndFriends.map(({_id,name,avatar})=>({
        _id,name,avatar:avatar.url,
    }))


    return res.status(200).json({
        success:true,
        users
    })
})



 
const sendFriendRequest=TryCatch(async (req,res,next)=>{
    const {userId}=req.body
    const request=await Request.findOne({
        $or:[
            {
                sender:req.user,
                receiver:userId
            },
            {
                sender:userId,
                receiver:req.user
            }
        ]
    })

    if(request){
        return next(new ErrorHandler("Request already sent",400))
    }

    await Request.create({
        sender:req.user,
        receiver:userId,
    })

    emitEvent(req,NEW_REQUEST,[userId]);

    return res.status(200).json({
        success:true,
        message:"Friend Request Sent Successfully"
    })
})

const acceptFriendRequest=TryCatch(async (req,res,next)=>{
    const {requestId,accept}=req.body
    const request=await Request.findById(requestId)
    .populate("sender","name")
    .populate("receiver","name")


    if(!request){
        return next(new ErrorHandler("Request not found",404))
    }
    if(request.receiver._id.toString()!==req.user.toString()){
        return next(new ErrorHandler("Not Authorized to accept the request",401))
    }
    if(!accept){
        await request.deleteOne();
        return res.status(200).json({
            success:true,
            message:" Friend Request Rejected"
        })
    }

    const members=[request.sender._id,request.receiver._id]

    await Promise.all([
        Chat.create({
            members,
            name:`${request.sender.name} - ${request.receiver.name}`
        }),
        request.deleteOne()
    ])

    emitEvent(req,REFETCH_CHATS,members)

    return res.status(200).json({
        success:true,
        message:"Request Accepted",
        senderId:request.sender._id
    })
})

const getMyNotifications=TryCatch(async (req,res,next)=>{
    //find all the request and populate
    const requests=await Request.find({
        receiver:req.user

    }).populate(
        "sender","name avatar"
    )

    //map request to get id of sender ,name of suder,
    const allRequest=requests.map(({_id,sender})=>({
        _id,sender:{
            _id:sender._id,
            name:sender.name,
            avatar:sender.avatar.url
        }
    }))
    
    return res.status(200).json({
        success:true,
        allRequest
    })
})

const getMyFriends=TryCatch(async(req,res,next)=>{
    //get chat id from query
    const chatId=req.query.chatId
    //find all chats with you as member and group chat false
    const chats=await Chat.find({
        groupChat:false,
        members:req.user
    }).populate("members","name avatar")

   
    //get other member from members array
    const friends=chats.map(({members})=>{
        const otherUser=getOtherMember(members,req.user)
        return{
            _id:otherUser._id,
            name:otherUser.name,
            avatar:otherUser.avatar.url
        }
    })
    //to get available users
    if(chatId){
        const chat=await Chat.findById(chatId)

        const availableFriends=friends.filter((friend)=>!chat.members.includes(friend._id))
        return res.status(200).json({
            success:true,
            friends:availableFriends
        })
    }
    //if chat id is not present
    else{
        return res.status(200).json({
            success:true,
            friends
        })
    }

    
})

export {login,newUser,getMyProfile,logout,searchUser,sendFriendRequest,acceptFriendRequest,getMyNotifications,getMyFriends}
