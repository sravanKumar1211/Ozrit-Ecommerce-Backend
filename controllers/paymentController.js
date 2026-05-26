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
        key: process.env.RAZORPAY_KEY_ID,
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
    const ecommerceOrderId = payment?.notes?.orderId;

    if (!razorpayOrderId) {
      return res.status(200).json({
        success: true,
        message: "Webhook received",
      });
    }

    let order = await Order.findOne({
      where: { razorpayOrderId },
    });

    if (!order && ecommerceOrderId) {
      order = await Order.findByPk(ecommerceOrderId);
    }

    if (!order) {
      return res.status(200).json({
        success: true,
        message: "Order not found for webhook",
      });
    }

    if (event.event === "payment.captured") {
      order.paymentStatus = "paid";
      order.razorpayPaymentId = payment.id;
      order.razorpayOrderId = razorpayOrderId;
      await order.save();
    }

    if (event.event === "payment.failed") {
      order.paymentStatus = "failed";
      await order.save();
    }

    res.status(200).json({
      success: true,
      message: "Webhook processed successfully",
      data: {
        orderId: order.id,
        paymentStatus: order.paymentStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyRazorpayPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification fields are required",
        data: {},
      });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      throw new Error("Razorpay key secret is required");
    }

    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const expectedSignatureBuffer = Buffer.from(expectedSignature);
    const signatureBuffer = Buffer.from(razorpay_signature);
    const isValidSignature =
      expectedSignatureBuffer.length === signatureBuffer.length &&
      crypto.timingSafeEqual(expectedSignatureBuffer, signatureBuffer);

    if (!isValidSignature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
        data: {},
      });
    }

    // Verify order exists but don't update status
    // Status will be updated by webhook (source of truth)
    const order = await Order.findOne({
      where: {
        razorpayOrderId: razorpay_order_id,
        userId: req.user.id,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found for payment verification",
        data: {},
      });
    }

    // Only store razorpayPaymentId if not already set
    // Webhook will update payment status
    if (!order.razorpayPaymentId) {
      order.razorpayPaymentId = razorpay_payment_id;
      await order.save();
    }

    res.status(200).json({
      success: true,
      message: "Payment signature verified. Awaiting confirmation.",
      data: {
        orderId: order.id,
        paymentStatus: order.paymentStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};
