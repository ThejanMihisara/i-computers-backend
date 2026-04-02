import Order from "../models/order.js";
import Product from "../models/product.js";
import { isAdmin } from "./userController.js";

export async function createOrder(req, res) {
	
    if (req.user == null) {
        console.log(req.user)
        res.status(401).json({ message: "Unauthorized. Please log in to place an order." });
        return;
    }

	try {
		const orderData = {
			orderId: "ORD000001",
			firstName: req.body.firstName,
			lastName: req.body.lastName,
			addressLine1: req.body.addressLine1,
			addressLine2: req.body.addressLine2,
			city: req.body.city,
			country: req.body.country,
			postalCode: req.body.postalCode,
			email: req.user.email,
			items: [],
			phone: req.body.phone,
			total: 0,
		};

        if(orderData.firstName == ""){
            orderData.firstName = req.user.firstName
        }
        if(orderData.lastName == ""){
            orderData.lastName = req.user.lastName
        }

        if(orderData.addressLine1 == ""){
            res.status(400).json({ message : "Address Line 1 is required" })
            return
        }
        if(orderData.addressLine2 == ""){
            res.status(400).json({ message : "Address Line 2 is required" })
            return
        }
        if(orderData.city == ""){
            res.status(400).json({ message : "City is required" })
            return
        }
        if(orderData.country == ""){
            res.status(400).json({ message : "Country is required" })
            return
        }
        if(orderData.postalCode == ""){
            res.status(400).json({ message : "Postal Code is required" })
            return
        }

		const lastOrder = await Order.findOne().sort({ date: -1 });

		if (lastOrder != null) {
			const lastOrderId = lastOrder.orderId; //"ORD000029"

			const lastOrderNumberInString = lastOrderId.replace("ORD", ""); //"000029"

			const lastOrderNumber = parseInt(lastOrderNumberInString); //29

			const newOrderNumber = lastOrderNumber + 1; //30

			const newOrderNumberInString = newOrderNumber.toString().padStart(6, "0"); //"000030"

			orderData.orderId = "ORD" + newOrderNumberInString; //"ORD000030"


		}

        for(let i = 0; i< req.body.items.length; i++){

            const item = req.body.items[i]

            const product = await Product.findOne({ productId : item.productId })

            if(product == null){

                res.status(404).json({ message : "Product with id " + item.productId + " not found. Please remove it from your cart and try again." })
                return
            }

            if(product.isVisible == false){
                res.status(404).json({ message : "Product with id " + item.productId + " is not available. Please remove it from your cart and try again." })
                return
            }

            // if(product.qty < item.qty){

            //     res.status(404).json({ message : "Only " + product.qty + " items available for product with id " + item.productId + ". Please adjust the quantity in your cart and try again." })
            //     return
            // }

            orderData.items.push({
                productId : product.productId,
                name : product.name,
                price : product.price,
                labelledPrice : product.labelledPrice,
                image : product.imageUrls.length > 0 ? product.imageUrls[0] : "https://via.placeholder.com/150",
                quantity : item.quantity
            })

            
            orderData.total += product.price * item.quantity
        }
        
        const order = new Order(orderData);
        await order.save();

        //reduce the qty from the products collection
        // for(let i = 0; i< orderData.items.length; i++){

        //     const item = orderData.items[i]
        //     await Product.updateOne({ productId : item.productId }, { $inc : { qty : -item.quantity } })
        // }

        res.status(201).json({ message: "Order created successfully", orderId : orderData.orderId });

	} catch (error) {
		console.log("Error creating order", error);
		res.status(500).json({ message: "Error creating order", error: error });
	}
	//
}

export async function getorders(req,res){
    if (req.user == null) {
        res.status(401).json({ message: "Unauthorized. Please log in to view your orders." });
        return;
    }


    const pageSizeInString = req.params.pageSize || "10"
    const pageNumberInString = req.params.pageNumber || "1"

    const pageSize = parseInt(pageSizeInString)
    const pageNumber = parseInt(pageNumberInString)

    const skip = (pageNumber - 1) * pageSize
try{

    if(isAdmin(req)){

        const numberOfOrders = await Order.countDocuments()
        const numberOfPages = Math.ceil(numberOfOrders / pageSize)
        const orders = await Order.find().sort({ date : -1 }).skip((pageNumber-1)*pageSize).limit(pageSize)

       res.json({
            orders : orders,
            totalPages : numberOfPages,
        })
      



    }else{

        const numberOfOrders = await Order.countDocuments({ email : req.user.email })
        const numberOfPages = Math.ceil(numberOfOrders / pageSize)
        const orders = await Order.find({ email : req.user.email }).sort({ date : -1 }).skip((pageNumber-1)*pageSize).limit(pageSize)

       res.json({
            orders : orders,
            totalPages : numberOfPages,
       })
    }
}catch(error){
    console.log("Error fetching orders", error);
    res.status(500).json({ message: "Error fetching orders", error: error });
}
}