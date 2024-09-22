import {TryCatch} from "../middleware/error.js"
import { Chat } from "../models/chat.js"
import { User } from "../models/user.js"
import { Message } from "../models/message.js"
import { ErrorHandler } from "../utils/utility.js"
import jwt from "jsonwebtoken"
import { cookieOptions } from "../utils/features.js"
import { adminSecretKey } from "../app.js"

const adminLogin=TryCatch(async (req,res,next)=>{
    const {secretKey}=req.body

    const isMatch=secretKey===adminSecretKey;
    if(isMatch){
        const token=jwt.sign(secretKey,process.env.JWT_SECRET)
        return res.status(200).cookie("sync-admin-token",token,{...cookieOptions,maxAge:1000*60*25}).json({
            success:true,
            message:"Authenticated Successfully"
        })
    }
    else{
        return next(new ErrorHandler("Invalid key Enter the secret",401))
    }
})

const adminLogout=TryCatch(async (req,res,next)=>{
    
    return res.status(200).cookie("sync-admin-token","",{...cookieOptions,maxAge:0}).json({
        success:true,
        message:"Logged Out Of Admin Successfully"
    })
})

const getAdminData=TryCatch(async (req,res,next)=>{
    return res.status(200).json({
        admin:true
    })
})

const allUsers=TryCatch(async (req,res,next)=>{
    const users=await User.find({})

    const transformedUsers=await Promise.all(
        users.map(async ({_id,name,username,avatar})=>{
            const [groups,friends]=await Promise.all([
                Chat.countDocuments({
                    members:_id,
                    groupChat:true
                }),
                Chat.countDocuments({
                    members:_id,
                    groupChat:false
                })
            ])
            return {
                _id,
                name,
                username,
                avatar:avatar.url,
                groups,
                friends
            }
        })
    )

    return res.status(200).json({
        success:true,
        users:transformedUsers
    })
})


const allChats=TryCatch(async (req,res,next)=>{
    const chats=await Chat.find({}).populate("members","name avatar")
    .populate("creator","name avatar")

    const transformedChats=await Promise.all(
        chats.map(async ({members,_id,groupChat,name,creator})=>{

            const totalMessages=await Message.countDocuments({chat:_id})
            return {
                _id,
                name,
                groupChat,
                avatar:members.slice(0,3).map((member)=>member.avatar.url),
                members:members.map(({_id,name,avatar})=>(
                     {
                        _id,
                        name,
                        avatar:avatar.url
                    }
                )),
                creator:{
                    name:creator?.name || "None",
                    avatar:creator?.avatar.url || ""
                },
                totalMembers:members.length,
                totalMessages
            }
        })
    )

    return res.status(200).json({
        success:true,
        chat:transformedChats
    })
})

const allMessages = TryCatch(async (req, res, next) => {
    const messages = await Message.find({})
        .populate("sender", "name avatar")
        .populate("chat", "groupChat");

    const transformedMessages = await Promise.all(
        messages.map(({ _id, content, attachments, sender, createdAt, chat }) => {
            // Check if sender or chat is null
            if (!sender) {
                console.warn(`Message with ID ${_id} has a missing sender.`);
                return null;  // Skip messages with missing sender
            }
            if (!chat) {
                console.warn(`Message with ID ${_id} has a missing chat.`);
                return null;  // Skip messages with missing chat
            }

            return {
                _id,
                content,
                attachments,
                createdAt,
                chat: chat._id,
                groupChat: chat.groupChat,
                sender: {
                    _id: sender._id,
                    name: sender.name,
                    avatar: sender.avatar.url,
                }
            };
        })
    );

    // Filter out any null entries (messages with missing sender or chat)
    const filteredMessages = transformedMessages.filter(Boolean);

    return res.status(200).json({
        success: true,
        messages: filteredMessages,
    });
});

const getDashboardStats=TryCatch(async (req,res,next)=>{
    
    const [groupsCount,usersCount,messagesCount,totalChatsCount]=await Promise.all([
        Chat.countDocuments({groupChat:true}),
        User.countDocuments({}),
        Message.countDocuments({}),
        Chat.countDocuments({})
    ])

    const today=new Date()

    const last7Days=new Date();

    last7Days.setDate(last7Days.getDate()-7)


    const last7DaysMessages=await Message.find({
        createdAt:{
            $gte:last7Days,
            $lte:today
        }
    }).select("createdAt")

    const messages=new Array(7).fill(0)

    last7DaysMessages.forEach(message=>{
        const indexApprox=(today.getTime()-message.createdAt.getTime())/(1000*60*60*24)
        const index=Math.floor(indexApprox)
        messages[6-index]++;
    })
    const stats={
                groupsCount,
                usersCount,
                messagesCount,
                totalChatsCount,
                messagesChart:messages
    }


    return res.status(200).json({
        success:true,
        stats
    })

})

export {allUsers,allChats,allMessages,getDashboardStats,adminLogin,adminLogout,getAdminData}