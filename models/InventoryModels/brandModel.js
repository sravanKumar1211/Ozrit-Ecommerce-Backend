import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";

const Brand = sequelize.define(
"Brand",
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

 logo:{
   type:DataTypes.STRING
 },

 status:{
   type:DataTypes.BOOLEAN,
   defaultValue:true
 }

},
{
 tableName:"brands",
 timestamps:true
}
);

export default Brand;