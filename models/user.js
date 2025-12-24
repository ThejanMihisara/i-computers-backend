import mongoose from "mongoose"

const userschema = new mongoose.Schema({
    
    firstName:{
        type:String,
        required:true
    },
    lastName:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    role:{
        type:String,
        required:true,
        enum:["admin","customer"],
        default: "customer"
    },
    isBlocked:{
        type:Boolean,
        default:false,
        required:true
    },
    isEmailVerified:{
        type:Boolean,
        default:false,
        required:true
    },
    image:{
        type:String,
        default:"/images/default-profile.png",
        required:true
    }
})

const User = mongoose.model("user",userschema)

export default User