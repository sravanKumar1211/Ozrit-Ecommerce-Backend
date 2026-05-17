import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Coupon = sequelize.define(
  "Coupon",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    couponCode: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    discountType: {
      type: DataTypes.ENUM("flat", "percent"),
      allowNull: false,
    },
    discountValue: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min(value) {
          if (value < 0) {
            throw new Error("discountValue must be a positive number");
          }
        },
        isPercentValid(value) {
          if (this.discountType === "percent" && value > 100) {
            throw new Error("discountValue cannot exceed 100 for percent discounts");
          }
        },
      },
    },
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    minPurchaseAmount: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    status: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "coupons",
    timestamps: true,
  },
);

export default Coupon;
