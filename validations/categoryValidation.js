import Joi from "joi";

export const categorySchema = Joi.object({
  name: Joi.string().trim().required(),
  status: Joi.boolean().optional(),
});
