import express from "express";
import { auth } from "../middlewares/auth.js";
import { createRazorpayOrder, razorpayWebhook } from "../controllers/paymentController.js";

const router = express.Router();

router.post("/create-order", auth, createRazorpayOrder);
router.post("/webhook", razorpayWebhook);

export default router;
