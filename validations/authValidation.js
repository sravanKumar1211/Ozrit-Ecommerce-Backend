import Joi from "joi";

export const registerSchema = Joi.object({
  name: Joi.string().trim().required(),
  email: Joi.string().trim().email().required(),
  password: Joi.string().min(6).required(),
  phone: Joi.string().trim().required(),
  address: Joi.object({
    houseNo: Joi.string().required(),
    street: Joi.string().required(),
    village: Joi.string().required(),
    city: Joi.string().required(),
    pincode: Joi.string().required(),
  }).optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().required(),
});
