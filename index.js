import express from 'express'
import mongoose from 'mongoose'
import userRouter from './router/userRouter.js'
import productRouter from './router/productRouter.js'
import authorizeUser from './lib/jwtMiddleware.js'




const mongoURI="mongodb+srv://admin:1234@cluster0.rkhcvin.mongodb.net/?appName=Cluster0"

mongoose.connect(mongoURI).then(
    ()=>{console.log("Connected to Mongodb")
}).catch(
    ()=>{console.log("Error connecting to mongodb")
})

const app=express()

app.use(authorizeUser)

app.use(express.json())
app.use("/users",userRouter)
app.use("/products",productRouter)

app.listen(5000,()=>{console.log("server is running on port 5000")})