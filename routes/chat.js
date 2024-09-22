import express from "express"
import { isAuthenticated } from "../middleware/auth.js";
import { addMembers, deleteChat, getChatDetails, getMessages, getMyChats, getMyGroups, leaveGroup, newGroupChat, removeMember, renameGroup, sendAttachments } from "../controllers/chat.js";
import { attachmentsMulter } from "../middleware/multer.js";
import { addMemberValidator, ChatIdValidator, newGroupValidator, removeMemberValidator, renameGroupValidator, sendAttachmentsValidator, validateHandler } from "../lib/validators.js";

const app=express.Router();


//after here user must be logged in to acces the internet


app.use(isAuthenticated)


app.post("/new",newGroupValidator(),validateHandler,newGroupChat)


app.get("/my",getMyChats)


app.get("/my/groups",getMyGroups)

app.put("/addmembers",addMemberValidator(),validateHandler,addMembers)

app.put("/removemember",removeMemberValidator(),validateHandler,removeMember)

app.delete("/leave/:id",ChatIdValidator(),validateHandler,leaveGroup)

//send attachment
app.post("/message",attachmentsMulter,sendAttachmentsValidator(),validateHandler,sendAttachments)

//get messages
app.get("/message/:id",ChatIdValidator(),validateHandler,getMessages)

//get chat details,rename,delete
app.route("/:id").get(ChatIdValidator(),validateHandler,getChatDetails).put(renameGroupValidator(),validateHandler,renameGroup).delete(ChatIdValidator(),validateHandler,deleteChat)




export default app