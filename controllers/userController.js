import User from "../models/user.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import dotenv from "dotenv"
import e from "express"

dotenv.config()


export function createUser(req,res){

const hashPassword = bcrypt.hashSync(req.body.password,10)

       const user = new User({

        firstName:req.body.firstName,
        lastName:req.body.lastName,
        email:req.body.email,
        password:hashPassword

       })

       user.save().then(
        ()=>{
            res.json({
                message:"user create successfully"
            })
        }
       ).catch(
        ()=>{
            res.json({
                message:"user creation failed"
        })
        }
       )
    
}


export function loginUser(req,res){

     User.findOne( 
        {
        email:req.body.email
        }
    ).then(
        (user)=>{
            if(user == null){
                res.status(404).json({
                    message:"User with given email not found"
                })
            }else{
                const isPasswordValid = bcrypt.compareSync(req.body.password,user.password)
                if(isPasswordValid){

                      const token = jwt.sign({
                        firstName:user.firstName,
                        lastName:user.lastName,
                        email:user.email,
                        role:user.role,
                        isEmailverified:user.isEmailVerified,
                        image:user.image

                      },process.env.JWT_SECRET,
                      { expiresIn:req.body.rememberMe ? '30d' : '48h'})

                    res.json({
                        message:"login successfully",
                        token:token,
                        role:user.role
                    })
                }else{
                    res.status(401).json({
                        message:"invalid password"
                    })
                }
            }
        }
     )

}

export function isAdmin(req){
    if(req.user == null){
        return false
    }
    if(req.user.role == "admin"){
        return true
    }else{
        return false
    }
    
}