import express from 'express'
import mongoose from 'mongoose'
import userRouter from './router/userRouter.js'
import productRouter from './router/productRouter.js'
import authorizeUser from './lib/jwtMiddleware.js'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()



const mongoURI=process.env.MONGO_URI

mongoose.connect(mongoURI).then(
    ()=>{console.log("Connected to Mongodb")
}).catch(
    ()=>{console.log("Error connecting to mongodb")
})

const app=express()
app.use(cors())
app.use(authorizeUser)

app.use(express.json())
app.use("/api/users",userRouter)
app.use("/api/products",productRouter)

app.listen(5000,()=>{console.log("server is running on port 5000")})