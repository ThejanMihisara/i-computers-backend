import express from "express"
import { createproduct, deleteProduct, getAllProducts, getproductbyId, updateProduct } from "../controllers/productController.js"




const productRouter = express.Router()

productRouter.post("/",createproduct)
productRouter.get("/",getAllProducts)
productRouter.get("/trending",(req,res)=>{
    res.status(200).json({message:"trending products"})
})

//user engagement





productRouter.delete("/:productId",deleteProduct)
productRouter.put("/:productId",updateProduct)
productRouter.get("/:productId",getproductbyId)


export default productRouter