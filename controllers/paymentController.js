import crypto from "crypto";
import Order from "../models/orderModel.js";
import { getRazorpayInstance, getRazorpayWebhookSecret } from "../config/razorpay.js";

export const createRazorpayOrder = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "orderId is required",
        data: {},
      });
    }

    const order = await Order.findOne({
      where: {
        id: orderId,
        userId: req.user.id,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
        data: {},
      });
    }

    if (order.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "Order is already paid",
        data: {},
      });
    }

    const amount = Math.round(parseFloat(order.finalAmount) * 100);

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid order amount",
        data: {},
      });
    }

    const razorpay = getRazorpayInstance();
    const razorpayOrder = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `order_${order.id}`,
      notes: {
        orderId: String(order.id),
        userId: String(order.userId),
      },
    });

    order.paymentMethod = "razorpay";
    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    res.status(200).json({
      success: true,
      message: "Razorpay order created successfully",
      data: {
        orderId: order.id,
        razorpayOrder,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const razorpayWebhook = async (req, res, next) => {
  try {
    const webhookSecret = getRazorpayWebhookSecret();
    const signature = req.headers["x-razorpay-signature"];

    if (!signature || !req.rawBody) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook request",
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(req.rawBody)
      .digest("hex");

    const expectedSignatureBuffer = Buffer.from(expectedSignature);
    const signatureBuffer = Buffer.from(signature);
    const isValidSignature =
      expectedSignatureBuffer.length === signatureBuffer.length &&
      crypto.timingSafeEqual(expectedSignatureBuffer, signatureBuffer);

    if (!isValidSignature) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature",
      });
    }

    const event = req.body;
    const payment = event?.payload?.payment?.entity;
    const razorpayOrderId = payment?.order_id;

    if (!razorpayOrderId) {
      return res.status(200).json({
        success: true,
        message: "Webhook received",
      });
    }

    const order = await Order.findOne({
      where: { razorpayOrderId },
    });

    if (!order) {
      return res.status(200).json({
        success: true,
        message: "Order not found for webhook",
      });
    }

    if (event.event === "payment.captured") {
      order.paymentStatus = "paid";
      order.razorpayPaymentId = payment.id;
      await order.save();
    }

    if (event.event === "payment.failed") {
      order.paymentStatus = "failed";
      await order.save();
    }

    res.status(200).json({
      success: true,
      message: "Webhook processed successfully",
    });
  } catch (error) {
    next(error);
  }
};
