import express from "express";
import { auth, adminAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import {
  createOrder,
  getMyOrders,
  getMyOrderById,
  getOrderHistory,
  getAllOrders,
  getOrdersByUser,
  getOrdersByProduct,
  updateOrderStatus,
} from "../controllers/orderController.js";
import { createOrderSchema, orderStatusSchema } from "../validations/orderValidation.js";

const router = express.Router();

// User order APIs
router.post("/order", auth, validate(createOrderSchema), createOrder);
router.get("/my-orders", auth, getMyOrders);
router.get("/my-orders/:id", auth, getMyOrderById);
router.get("/order-history", auth, getOrderHistory);


// Admin order APIs
router.get("/admin/orders", auth, adminAuth, getAllOrders);
router.get("/admin/orders/user/:id", auth, adminAuth, getOrdersByUser);
router.get("/admin/orders/product/:id", auth, adminAuth, getOrdersByProduct);
router.put("/admin/order/status", auth, adminAuth, validate(orderStatusSchema), updateOrderStatus);

export default router;
