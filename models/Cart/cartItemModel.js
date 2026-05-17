import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";
import Cart from "./cartModel.js";
import ProductVariant from "../InventoryModels/productVariantModel.js";

const CartItem = sequelize.define(
  "CartItem",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    cartId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    productVariantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
  },
  {
    tableName: "cart_items",
    timestamps: true,
  },
);

Cart.hasMany(CartItem, {
  foreignKey: "cartId",
});

CartItem.belongsTo(Cart, {
  foreignKey: "cartId",
});

ProductVariant.hasMany(CartItem, {
  foreignKey: "productVariantId",
});

CartItem.belongsTo(ProductVariant, {
  foreignKey: "productVariantId",
});

export default CartItem;
