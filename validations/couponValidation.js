import Joi from "joi";

export const couponSchema = Joi.object({
  couponCode: Joi.string().trim().required(),
  discountType: Joi.string().valid("flat", "percent").required(),
  discountValue: Joi.number().min(0).required().when("discountType", {
    is: "percent",
    then: Joi.number().max(100),
    otherwise: Joi.number().min(0),
  }),
  expiryDate: Joi.date().required(),
  minPurchaseAmount: Joi.number().min(0).optional(),
  status: Joi.boolean().optional(),
});
