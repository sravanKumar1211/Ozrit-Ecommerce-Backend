import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import User from "./userModel.js";
import Coupon from "./couponModel.js";

const Order = sequelize.define(
  "Order",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    couponId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    totalAmount: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    discountAmount: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    finalAmount: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    paymentStatus: {
      type: DataTypes.ENUM("pending", "paid", "failed"),
      defaultValue: "pending",
    },
    paymentMethod: {
      type: DataTypes.STRING,
      defaultValue: "razorpay",
    },
    razorpayOrderId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    razorpayPaymentId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    orderStatus: {
      type: DataTypes.ENUM("pending", "packed", "shipped", "delivered", "cancelled"),
      defaultValue: "pending",
    },
    address: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    tableName: "orders",
    timestamps: true,
  },
);

User.hasMany(Order, {
  foreignKey: "userId",
});

Order.belongsTo(User, {
  foreignKey: "userId",
});

Coupon.hasMany(Order, {
  foreignKey: "couponId",
});

Order.belongsTo(Coupon, {
  foreignKey: "couponId",
});

export default Order;
