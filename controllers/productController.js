import Product from "../models/product.js"
import { isAdmin } from "./userController.js"



export async function createproduct(req,res){

    if(!isAdmin(req)){
        res.status(401).json({message:"not authorized"})
        return
    }
    try{
        const existingProduct = await Product.findOne({productId:req.body.productId})

        if(existingProduct){
            res.status(400).json({message:"Product with given productId already exists"})
            return
        }

const data={};

data.productId=req.body.productId;

if(req.body.name == null){
    res.status(400).json({message:"name is required"})
    return  
};
data.name=req.body.name;

data.description=req.body.description|| "";

if(req.body.price == null){
    res.status(400).json({message:"price is required"})
    return  
};

data.price=req.body.price;

data.labelledPrice=req.body.labelledPrice || req.body.price
data.category=req.body.category || "others"
data.altNames=req.body.altNames|| []
data.images=req.body.images|| ["/images/default-product-1.png","/images/default-product-2.png"]
data.isVisible=req.body.isVisible
data.brand=req.body.brand || "Generic"
data.model=req.body.model || "standard"

const newProduct = new Product(data)
await newProduct.save()
res.json({message:"Product created successfully"})


    }catch(error){
        res.status(400).json({message:"error creating product",error:error.message})
    }
}

export async function getAllProducts(req,res){

    try{
        if(isAdmin(req)){
           const products = await Product.find()
           res.status(200).json(products)
        }else{
            const products = await Product.find({isVisible:true})
            res.status(200).json(products)
        }
        
    }catch(error){
        res.status(500).json({message:"error fetching products",error:error.message})
    }
}

export async function deleteProduct(req,res){
    if(!isAdmin(req)){
        res.status(403).json({message:"not authorized"})
        return
    }
    try{
        const productId = req.params.productId
        await Product.deleteOne({productId:productId})
        res.status(200).json({message:"Product deleted successfully"})
    }catch(error){
        res.status(500).json({message:"error deleting product",error:error.message})
    
}
}

export async function updateProduct(req,res){
 if(!isAdmin(req)){
        res.status(401).json({message:"not authorized"})
        return
    }
    try{
       const productId = req.params.productId
        

const data={};

if(req.body.name == null){
    res.status(400).json({message:"name is required"})
    return  
};
data.name=req.body.name;

data.description=req.body.description|| "";

if(req.body.price == null){
    res.status(400).json({message:"price is required"})
    return  
};

data.price=req.body.price;

data.labelledPrice=req.body.labelledPrice || req.body.price
data.category=req.body.category || "others"
data.altNames=req.body.altNames|| []
data.images=req.body.images|| ["/images/default-product-1.png","/images/default-product-2.png"]
data.isVisible=req.body.isVisible
data.brand=req.body.brand || "Generic"
data.model=req.body.model || "standard"

await Product.updateOne({productId:productId},data)
res.json({message:"Product updated successfully"})


    }catch(error){
        res.status(400).json({message:"error updating product",error:error.message})
    }
}


export async function getproductbyId(req,res){
    try{
        
        const productId = req.params.productId
        const product = await Product.findOne({productId:productId})
        
        if(product == null){
            res.status(404).json({message:"Product not found"})
            return
        }
        if(!product.isVisible){
            if(!isAdmin(req)){
                res.status(404).json({message:"Product is not found"})
                return
            }
        }
        res.status(200).json(product)
    }catch(error){
        res.status(500).json({message:"error fetching product",error:error.message})
    }
}