import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";
import User from "../userModel.js";

const Cart = sequelize.define(
  "Cart",
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
  },
  {
    tableName: "carts",
    timestamps: true,
  },
);

User.hasOne(Cart, {
  foreignKey: "userId",
});

Cart.belongsTo(User, {
  foreignKey: "userId",
});

export default Cart;
