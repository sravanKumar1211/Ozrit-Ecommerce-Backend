import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";
import Product from "./productModel.js";

const ProductVariant = sequelize.define(
  "ProductVariant",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    color: {
      type: DataTypes.STRING,
    },

    size: {
      type: DataTypes.STRING,
    },

    stock: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },

    sku: {
      type: DataTypes.STRING,
      unique: true,
    },

    image: {
      type: DataTypes.STRING,
    },

    status: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "product_variants",
    timestamps: true,
  },
);

Product.hasMany(ProductVariant, {
  foreignKey: "productId",
});

ProductVariant.belongsTo(Product, {
  foreignKey: "productId",
});

export default ProductVariant;
