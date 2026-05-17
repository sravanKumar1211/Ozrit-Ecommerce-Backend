import Joi from "joi";

export const productSchema = Joi.object({
  categoryId: Joi.number().integer().required(),
  subCategoryId: Joi.number().integer().required(),
  brandId: Joi.number().integer().required(),
  name: Joi.string().trim().required(),
  description: Joi.string().optional(),
  status: Joi.boolean().optional(),
});

export const variantSchema = Joi.object({
  productId: Joi.number().integer().required(),
  color: Joi.string().trim().optional(),
  size: Joi.string().trim().optional(),
  stock: Joi.number().integer().min(0).required(),
  price: Joi.number().min(0).required(),
  sku: Joi.string().trim().required(),
  status: Joi.boolean().optional(),
});
