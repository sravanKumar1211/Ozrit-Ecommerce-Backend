import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";
import Category from "./categoryModel.js";
import SubCategory from "./subCategoryModel.js";
import Brand from "./brandModel.js";

const Product = sequelize.define(
"Product",
{

 id:{
   type:DataTypes.INTEGER,
   autoIncrement:true,
   primaryKey:true
 },

 categoryId:{
   type:DataTypes.INTEGER,
   allowNull:false
 },

 subCategoryId:{
   type:DataTypes.INTEGER,
   allowNull:false
 },

 brandId:{
   type:DataTypes.INTEGER,
   allowNull:false
 },

 name:{
   type:DataTypes.STRING,
   allowNull:false
 },

 description:{
   type:DataTypes.TEXT
 },

 thumbnail:{
   type:DataTypes.STRING
 },

 status:{
   type:DataTypes.BOOLEAN,
   defaultValue:true
 }

},
{
 tableName:"products",
 timestamps:true
}
);

Category.hasMany(Product,{
 foreignKey:"categoryId"
});

Product.belongsTo(Category,{
 foreignKey:"categoryId"
});

SubCategory.hasMany(Product,{
 foreignKey:"subCategoryId"
});

Product.belongsTo(SubCategory,{
 foreignKey:"subCategoryId"
});

Brand.hasMany(Product,{
 foreignKey:"brandId"
});

Product.belongsTo(Brand,{
 foreignKey:"brandId"
});

export default Product;