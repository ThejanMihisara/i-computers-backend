import express from "express";
import { createOrder, getorders } from "../controllers/orderController.js";

const orderRouter = express.Router();

orderRouter.post("/",createOrder)
orderRouter.get("/:pageSize/:pageNumber",getorders)

export default orderRouter;