import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    productId:{
        type:String,
        required:true,
        unique:true
    },
    name:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    altNames:{
        type:[String],
        default:[]
    },
    price:{
        type:Number,
        required:true
    },
    labelledPrice:{
        type:Number,
    },
    category:{
        type:String,
        default:"others"
    },
    images:{
        type:[String],
        required:true,
        default:["/images/default-product-1.png","/images/default-product-2.png"]
    },
    isVisible:{
        type:Boolean,
        default:true,
        required:true
    },
    brand:{
        type:String,
        default:"Generic"
    },
    model:{
        type:String,
        default:"standard"
    }
    

})

const Product =mongoose.model("product",productSchema)

export default Product