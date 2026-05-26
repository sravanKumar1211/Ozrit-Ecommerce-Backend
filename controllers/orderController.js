import { Op } from "sequelize";
import sequelize from "../config/db.js";
import Cart from "../models/Cart/cartModel.js";
import CartItem from "../models/Cart/cartItemModel.js";
import Order from "../models/orderModel.js";
import OrderItem from "../models/orderItemModel.js";
import Product from "../models/InventoryModels/productModel.js";
import ProductVariant from "../models/InventoryModels/productVariantModel.js";
import Coupon from "../models/couponModel.js";
import User from "../models/userModel.js";

// Create a new order from cart
export const createOrder = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const userId = req.user.id;
    const { couponCode, address: rawAddress } = req.body;
    const address =
      typeof rawAddress === "string"
        ? { fullAddress: rawAddress.trim() }
        : rawAddress || null;

    const cart = await Cart.findOne({
      where: { userId },
      include: [
        {
          model: CartItem,
          include: [
            {
              model: ProductVariant,
              include: [Product],
            },
          ],
        },
      ],
      transaction,
    });

    if (!cart || !cart.CartItems || cart.CartItems.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
        data: {},
      });
    }

    const verifiedItems = [];
    let subtotal = 0;

    for (const item of cart.CartItems) {
      const variant = item.ProductVariant;
      if (!variant) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Cart contains invalid product variant",
          data: {},
        });
      }

      const product = variant.Product;
      if (!product || !product.status) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Product is disabled or unavailable",
          data: {},
        });
      }

      if (!variant.status) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Product variant is disabled",
          data: {},
        });
      }

      if (variant.stock < item.quantity) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for variant ${variant.id}`,
          data: {},
        });
      }

      const itemTotal = parseFloat((variant.price * item.quantity).toFixed(2));
      subtotal += itemTotal;
      verifiedItems.push({ item, variant, product, itemTotal });
    }

    subtotal = parseFloat(subtotal.toFixed(2));
    let discountAmount = 0;
    let couponId = null;

    const normalizedCouponCode =
      typeof couponCode === "string" ? couponCode.trim() : "";

    if (normalizedCouponCode) {
      const coupon = await Coupon.findOne({
        where: { couponCode: normalizedCouponCode, status: true },
      });

      if (!coupon) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Coupon not found or inactive",
          data: {},
        });
      }

      if (new Date(coupon.expiryDate) < new Date()) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Coupon has expired",
          data: {},
        });
      }

      if (subtotal < parseFloat(coupon.minPurchaseAmount || 0)) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Minimum purchase amount of ${coupon.minPurchaseAmount} is required to apply this coupon`,
          data: {},
        });
      }

      discountAmount = parseFloat(coupon.discountValue);
      if (coupon.discountType === "percent") {
        discountAmount = parseFloat(((subtotal * discountAmount) / 100).toFixed(2));
      }
      discountAmount = Math.min(discountAmount, subtotal);
      couponId = coupon.id;
    }

    const finalAmount = parseFloat((subtotal - discountAmount).toFixed(2));

    const order = await Order.create(
      {
        userId,
        couponId,
        totalAmount: subtotal,
        discountAmount,
        finalAmount,
        paymentStatus: "pending",
        orderStatus: "pending",
        address: address || null,
      },
      { transaction },
    );

    const orderItems = [];
    for (const verified of verifiedItems) {
      const orderItem = await OrderItem.create(
        {
          orderId: order.id,
          productId: verified.product.id,
          productVariantId: verified.variant.id,
          quantity: verified.item.quantity,
          price: verified.variant.price,
          totalPrice: verified.itemTotal,
        },
        { transaction },
      );

      orderItems.push(orderItem);

      verified.variant.stock -= verified.item.quantity;
      await verified.variant.save({ transaction });
    }

    await CartItem.destroy({
      where: { cartId: cart.id },
      transaction,
    });

    await transaction.commit();

    const savedOrder = await Order.findByPk(order.id, {
      include: [
        { model: OrderItem, include: [Product, ProductVariant] },
        { model: Coupon },
        { model: User },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: { order: savedOrder },
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// Get orders for logged-in user
export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.findAll({
      where: { userId: req.user.id },
      include: [
        { model: OrderItem, include: [Product, ProductVariant] },
        { model: Coupon },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      message: "User orders fetched",
      data: { orders },
    });
  } catch (error) {
    next(error);
  }
};

// Get single order for logged-in user
export const getMyOrderById = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
      include: [
        { model: OrderItem, include: [Product, ProductVariant] },
        { model: Coupon },
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
        data: {},
      });
    }

    res.status(200).json({
      success: true,
      message: "Order fetched",
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

// Cancel order for logged-in user
export const cancelMyOrder = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const order = await Order.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
      transaction,
    });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Order not found",
        data: {},
      });
    }

    if (["delivered", "cancelled", "shipped"].includes(order.orderStatus)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "This order cannot be cancelled",
        data: {},
      });
    }

    const previousStatus = order.orderStatus;
    order.orderStatus = "cancelled";
    await order.save({ transaction });

    if (previousStatus !== "cancelled") {
      const orderItems = await OrderItem.findAll({
        where: { orderId: order.id },
        transaction,
      });

      for (const item of orderItems) {
        const variant = await ProductVariant.findByPk(item.productVariantId, { transaction });
        if (variant) {
          variant.stock += item.quantity;
          await variant.save({ transaction });
        }
      }
    }

    await transaction.commit();

    const savedOrder = await Order.findByPk(order.id, {
      include: [
        { model: OrderItem, include: [Product, ProductVariant] },
        { model: Coupon },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      data: { order: savedOrder },
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// Get delivered and cancelled orders for logged-in user
export const getOrderHistory = async (req, res, next) => {
  try {
    const orders = await Order.findAll({
      where: {
        userId: req.user.id,
        orderStatus: {
          [Op.in]: ["delivered", "cancelled"],
        },
      },
      include: [
        { model: OrderItem, include: [Product, ProductVariant] },
        { model: Coupon },
      ],
      order: [["updatedAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      message: "Order history fetched",
      data: { orders },
    });
  } catch (error) {
    next(error);
  }
};

// Get all orders for admin
export const getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.findAll({
      include: [
        { model: OrderItem, include: [Product, ProductVariant] },
        { model: Coupon },
        { model: User },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      message: "All orders fetched",
      data: { orders },
    });
  } catch (error) {
    next(error);
  }
};

// Get orders for a specific user (admin)
export const getOrdersByUser = async (req, res, next) => {
  try {
    const orders = await Order.findAll({
      where: { userId: req.params.id },
      include: [
        { model: OrderItem, include: [Product, ProductVariant] },
        { model: Coupon },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      message: "User orders fetched",
      data: { orders },
    });
  } catch (error) {
    next(error);
  }
};

// Get orders containing a specific product
export const getOrdersByProduct = async (req, res, next) => {
  try {
    const orders = await Order.findAll({
      include: [
        {
          model: OrderItem,
          where: { productId: req.params.id },
          include: [Product, ProductVariant],
        },
        { model: Coupon },
        { model: User },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      message: "Orders containing product fetched",
      data: { orders },
    });
  } catch (error) {
    next(error);
  }
};

// Update order status by admin
export const updateOrderStatus = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { orderId, orderStatus } = req.body;
    const allowedStatuses = ["pending", "packed", "shipped", "delivered", "cancelled"];

    if (!allowedStatuses.includes(orderStatus)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
        data: {},
      });
    }

    const order = await Order.findByPk(orderId, { transaction });
    if (!order) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Order not found",
        data: {},
      });
    }

    if (["delivered", "cancelled"].includes(order.orderStatus)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Delivered or cancelled orders cannot be updated",
        data: {},
      });
    }

    const previousStatus = order.orderStatus;
    order.orderStatus = orderStatus;
    await order.save({ transaction });

    if (orderStatus === "cancelled" && previousStatus !== "cancelled") {
      const orderItems = await OrderItem.findAll({ where: { orderId }, transaction });
      for (const item of orderItems) {
        const variant = await ProductVariant.findByPk(item.productVariantId, { transaction });
        if (variant) {
          variant.stock += item.quantity;
          await variant.save({ transaction });
        }
      }
    }

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: "Order status updated",
      data: { order },
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};
