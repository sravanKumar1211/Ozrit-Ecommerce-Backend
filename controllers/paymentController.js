import crypto from "crypto";
import Order from "../models/orderModel.js";
import User from "../models/userModel.js";
import OrderItem from "../models/orderItemModel.js";
import Product from "../models/InventoryModels/productModel.js";
import ProductVariant from "../models/InventoryModels/productVariantModel.js";
import Coupon from "../models/couponModel.js";
import { getRazorpayInstance, getRazorpayWebhookSecret } from "../config/razorpay.js";
import {
  sendPaymentReceivedEmail,
  sendAdminNewOrderEmail,
  sendAdminFailedPaymentEmail,
  sendOrderRefundedEmail,
} from "../services/emailService.js";

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
    const refund = event?.payload?.refund?.entity;
    const razorpayOrderId = payment?.order_id || refund?.order_id;
    const ecommerceOrderId = payment?.notes?.orderId || refund?.notes?.orderId;
    const razorpayPaymentId = payment?.id || refund?.payment_id;

    if (!razorpayOrderId && !razorpayPaymentId) {
      return res.status(200).json({
        success: true,
        message: "Webhook received but no order/payment identifiers found",
      });
    }

    let order = null;
    if (razorpayOrderId) {
      order = await Order.findOne({
        where: { razorpayOrderId },
      });
    }

    if (!order && razorpayPaymentId) {
      order = await Order.findOne({
        where: { razorpayPaymentId },
      });
    }

    if (!order && ecommerceOrderId) {
      order = await Order.findByPk(ecommerceOrderId);
    }

    if (!order) {
      return res.status(200).json({
        success: true,
        message: "Order not found for webhook",
      });
    }

    // ─── 1. Prevent Duplicate Processing ───
    if (order.paymentStatus === "paid" && (event.event === "payment.captured" || event.event === "order.paid")) {
      return res.status(200).json({
        success: true,
        message: "Webhook duplicate check: Order is already paid",
        data: {
          orderId: order.id,
          paymentStatus: order.paymentStatus,
        },
      });
    }

    // Fetch full order for sending emails
    const fetchFullOrder = async (orderId) => {
      return await Order.findByPk(orderId, {
        include: [
          { model: OrderItem, include: [Product, ProductVariant] },
          { model: Coupon },
          { model: User },
        ],
      });
    };

    // ─── 2. Handle payment.captured ───
    if (event.event === "payment.captured" || event.event === "order.paid") {
      order.paymentStatus = "paid";
      order.razorpayPaymentId = razorpayPaymentId || order.razorpayPaymentId;
      order.razorpayOrderId = razorpayOrderId || order.razorpayOrderId;
      if (!order.paidAt) {
        order.paidAt = new Date();
      }
      await order.save();

      const fullOrder = await fetchFullOrder(order.id);
      try {
        if (fullOrder && fullOrder.User) {
          sendPaymentReceivedEmail(fullOrder.User, fullOrder).catch(err => console.error("Payment received email failed:", err));
        }
        if (fullOrder) {
          sendAdminNewOrderEmail(fullOrder).catch(err => console.error("Admin alert email failed:", err));
        }
      } catch (mailErr) {
        console.error("Webhook payment capture email trigger failed:", mailErr);
      }
    }

    // ─── 3. Handle payment.failed ───
    if (event.event === "payment.failed") {
      order.paymentStatus = "failed";
      await order.save();

      const fullOrder = await fetchFullOrder(order.id);
      try {
        if (fullOrder) {
          const reason = payment?.error_description || "Razorpay checkout modal cancelled or payment failed";
          sendAdminFailedPaymentEmail(fullOrder, reason).catch(err => console.error("Admin payment failed email failed:", err));
        }
      } catch (mailErr) {
        console.error("Webhook payment failed email trigger failed:", mailErr);
      }
    }

    // ─── 4. Handle refund.processed ───
    if (event.event === "refund.processed") {
      // Mark payment as failed/refunded and order as cancelled
      const previousStatus = order.orderStatus;
      order.orderStatus = "cancelled";
      await order.save();

      // Restore stock when order is cancelled/refunded
      if (previousStatus !== "cancelled") {
        try {
          const orderItems = await OrderItem.findAll({ where: { orderId: order.id } });
          for (const item of orderItems) {
            const variant = await ProductVariant.findByPk(item.productVariantId);
            if (variant) {
              variant.stock += item.quantity;
              await variant.save();
            }
          }
        } catch (stockErr) {
          console.error("Webhook stock restoration failed:", stockErr);
        }
      }

      const fullOrder = await fetchFullOrder(order.id);
      try {
        if (fullOrder && fullOrder.User) {
          sendOrderRefundedEmail(fullOrder.User, fullOrder).catch(err => console.error("Refund email failed:", err));
        }
      } catch (mailErr) {
        console.error("Webhook refund email trigger failed:", mailErr);
      }
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

    // Verify order exists and update payment details
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

    // Set payment details synchronously upon verification
    order.paymentStatus = "paid";
    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;
    order.paidAt = new Date();
    await order.save();

    // Fetch full order with associations for emails
    const fullOrder = await Order.findOne({
      where: { id: order.id },
      include: [
        { model: OrderItem, include: [Product, ProductVariant] },
        { model: Coupon },
        { model: User },
      ],
    });

    // Send email notifications
    try {
      if (fullOrder && fullOrder.User) {
        sendPaymentReceivedEmail(fullOrder.User, fullOrder).catch(err => console.error("Payment received email failed:", err));
      }
      if (fullOrder) {
        sendAdminNewOrderEmail(fullOrder).catch(err => console.error("Admin new order email failed:", err));
      }
    } catch (mailErr) {
      console.error("Payment confirmation email trigger failed:", mailErr);
    }

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: {
        orderId: order.id,
        paymentStatus: order.paymentStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};
