import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";

const Category = sequelize.define(
"Category",
{
 id:{
   type:DataTypes.INTEGER,
   autoIncrement:true,
   primaryKey:true
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
 tableName:"categories",
 timestamps:true
}
);

export default Category;