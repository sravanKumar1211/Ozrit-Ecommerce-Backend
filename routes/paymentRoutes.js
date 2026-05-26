import express from "express";
import { auth } from "../middlewares/auth.js";
import {
  createRazorpayOrder,
  razorpayWebhook,
  verifyRazorpayPayment,
} from "../controllers/paymentController.js";

const router = express.Router();

router.post("/create-order", auth, createRazorpayOrder);
router.post("/verify", auth, verifyRazorpayPayment);
router.post("/webhook", razorpayWebhook);

export default router;
