import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";
import Category from "./categoryModel.js";

const SubCategory =
sequelize.define(
"SubCategory",
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

 name:{
   type:DataTypes.STRING,
   allowNull:false
 },

 image:{
   type:DataTypes.STRING
 },

 status:{
   type:DataTypes.BOOLEAN,
   defaultValue:true
 }

},
{
 tableName:"subcategories",
 timestamps:true
}
);

Category.hasMany(SubCategory,{
 foreignKey:"categoryId"
});

SubCategory.belongsTo(Category,{
 foreignKey:"categoryId"
});

export default SubCategory;