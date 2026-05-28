import Joi from "joi";

export const createOrderSchema = Joi.object({
  couponCode: Joi.string().trim().allow("", null).optional(),
  address: Joi.alternatives()
    .try(
      Joi.string().trim().min(3),
      Joi.object({
        houseNo: Joi.string().required(),
        street: Joi.string().required(),
        village: Joi.string().required(),
        city: Joi.string().required(),
        pincode: Joi.string().required(),
      }),
    )
    .required()
});

export const orderStatusSchema = Joi.object({
  orderId: Joi.number().integer().required(),
  orderStatus: Joi.string()
    .valid("pending", "packed", "shipped", "delivered", "cancelled")
    .required(),
});
