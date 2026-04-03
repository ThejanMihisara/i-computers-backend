import express from "express"
import { changeUserPassword, createUser, getUser, googleLogin, loginUser, sendOTP, updateUserProfile, verifyOTP } from "../controllers/userController.js"

const userRouter = express.Router()

userRouter.post("/",createUser)
userRouter.post("/login" , loginUser)
userRouter.post("/update-password", changeUserPassword)
userRouter.post("/send-otp",sendOTP)
userRouter.post("/verify-otp",verifyOTP)
userRouter.post("/google-login", googleLogin)
userRouter.put("/", updateUserProfile)
userRouter.get("/profile",getUser)

export default userRouter