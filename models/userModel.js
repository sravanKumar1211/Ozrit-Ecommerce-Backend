// models/User.js

import { DataTypes } from "sequelize";
import bcrypt from "bcrypt";
import sequelize from "../config/db.js";

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },

    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },

    phone: {
      type: DataTypes.STRING(15),
      allowNull: false,
      unique: true,
    },

    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    profileImage: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },

    address: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,

      validate: {
        isValidAddress(value) {
          if (value) {
            const requiredFields = [
              "houseNo",
              "street",
              "village",
              "city",
              "pincode",
            ];

            for (const field of requiredFields) {
              if (!(field in value)) {
                throw new Error(
                  `Missing ${field} in address`
                );
              }
            }
          }
        },
      },
    },

    role: {
      type: DataTypes.ENUM("user", "admin"),
      defaultValue: "user",
    },

    resetPasswordToken: {
      type: DataTypes.STRING,
      allowNull: true
    },

    resetPasswordExpire: {
      type: DataTypes.DATE,
      allowNull: true
    },
  },
  {
    tableName: "users",
    timestamps: true,

    hooks: {
      beforeCreate: async (user) => {
        const salt = await bcrypt.genSalt(10);

        user.password = await bcrypt.hash(
          user.password,
          salt
        );
      },

      beforeUpdate: async (user) => {
        if (user.changed("password")) {
          const salt = await bcrypt.genSalt(10);

          user.password = await bcrypt.hash(
            user.password,
            salt
          );
        }
      },
    },
  }
);

// compare password method
User.prototype.comparePassword =
  async function (enteredPassword) {
    return await bcrypt.compare(
      enteredPassword,
      this.password
    );
  };

export default User;