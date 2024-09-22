import {body, validationResult,param} from "express-validator"
import { ErrorHandler } from "../utils/utility.js"

const validateHandler=(req,res,next)=>{
    const errors=validationResult(req)
    const errorMessages=errors.array().map((error)=>error.msg).join(",")

    if(errors.isEmpty()){
        return next()
    }
    else{
        next(new ErrorHandler(errorMessages,400))
    }
}

const registerValidator=()=>[
    body("name","Please Enter Name").notEmpty(),
    body("username","Please Enter Username").notEmpty(),
    body("password","Please Enter Password").notEmpty(),
    body("bio","Please Enter Bio").notEmpty(),
]

const loginValidator=()=>[
    body("username","Please Enter Username").notEmpty(),
    body("password","Please Enter Password").notEmpty(),
]

const newGroupValidator=()=>[
    body("name","Please Enter Name").notEmpty(),
    body("members").notEmpty().withMessage("Please enter Members")
    .isArray({min:2,max:100}).withMessage("Members must be 2-100"),
]

const addMemberValidator=()=>[
    body("chatId","Please Enter chat ID").notEmpty(),
    body("members").notEmpty().withMessage("Please enter Members")
    .isArray({min:1,max:97}).withMessage("Members must be 1-97"),
]

const removeMemberValidator=()=>[
    body("chatId","Please Enter chat ID").notEmpty(),
    body("userId","Please enter User ID").notEmpty()
]



const sendAttachmentsValidator=()=>[
    body("chatId","Please Enter chat ID").notEmpty(),
    
]

const ChatIdValidator=()=>[
    param("id","Please enter Chat id").notEmpty(),
]


const renameGroupValidator=()=>[
    param("id","Please enter Chat id").notEmpty(),
    body("name","Please Enter New Name").notEmpty(),
]

const sendRequestValidator=()=>[
    body("userId","Please Enter User ID").notEmpty(),
]

const acceptRequestValidator=()=>[
    body("requestId","Please Enter Request ID").notEmpty(),
    body("accept").notEmpty()
    .withMessage("Please Add Accept")
    .isBoolean()
    .withMessage("Accept must be a boolean value"),
]


const adminLoginValidator=()=>[
    body("secretKey","Please Enter Secret Key").notEmpty(),
    
]
//handler for above


export {registerValidator,validateHandler,loginValidator,newGroupValidator,addMemberValidator,removeMemberValidator,sendAttachmentsValidator,ChatIdValidator,renameGroupValidator,sendRequestValidator,acceptRequestValidator,adminLoginValidator}