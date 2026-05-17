import { Op } from "sequelize";
import ProductVariant from "../../models/InventoryModels/productVariantModel.js";
import Product from "../../models/InventoryModels/productModel.js";
import { buildImagePath, buildImageUrl } from "../../utils/fileUtils.js";
import { getPagination, buildSearchFilter } from "../../utils/pagination.js";

// CREATE VARIANT
export const createVariant = async (req, res, next) => {
  try {
    const { productId, color, size, stock, price, sku, status } = req.body;
    const image = buildImagePath(req.file);

    const variant = await ProductVariant.create({
      productId,
      color,
      size,
      stock,
      price,
      sku,
      image,
      status,
    });

    const payload = variant.toJSON();
    payload.image = buildImageUrl(payload.image);

    res.status(201).json({
      success: true,
      variant: payload,
    });
  } catch (error) {
    next(error);
  }
};

// GET ALL VARIANTS
export const getVariants = async (req, res, next) => {
  try {
    const { page, limit, offset, search } = getPagination(req);
    const where = {
      status: true,
      ...(search ? buildSearchFilter(search, ["sku", "color", "size"]) : {}),
    };

    const { rows: variants, count } = await ProductVariant.findAndCountAll({
      where,
      include: [Product],
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    const results = variants.map((variant) => {
      const payload = variant.toJSON();
      payload.image = buildImageUrl(payload.image);
      return payload;
    });

    res.status(200).json({
      success: true,
      page,
      limit,
      total: count,
      variants: results,
    });
  } catch (error) {
    next(error);
  }
};

// GET SINGLE VARIANT
export const getSingleVariant = async (req, res, next) => {
  try {
    const variant = await ProductVariant.findOne({
      where: {
        id: req.params.id,
        status: true,
      },
      include: [Product],
    });

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: "Variant not found",
      });
    }

    const payload = variant.toJSON();
    payload.image = buildImageUrl(payload.image);

    res.status(200).json({
      success: true,
      variant: payload,
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE VARIANT
export const updateVariant = async (req, res, next) => {
  try {
    const variant = await ProductVariant.findByPk(req.params.id);

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: "Variant not found",
      });
    }

    const { productId, color, size, stock, price, sku, status } = req.body;
    variant.productId = productId || variant.productId;
    variant.color = color || variant.color;
    variant.size = size || variant.size;
    variant.stock = stock ?? variant.stock;
    variant.price = price || variant.price;
    variant.sku = sku || variant.sku;
    variant.status = status ?? variant.status;

    if (req.file) {
      variant.image = buildImagePath(req.file);
    }

    await variant.save();

    const payload = variant.toJSON();
    payload.image = buildImageUrl(payload.image);

    res.status(200).json({
      success: true,
      message: "Variant updated",
      variant: payload,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE VARIANT
export const deleteVariant = async (req, res, next) => {
  try {
    const variant = await ProductVariant.findByPk(req.params.id);

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: "Variant not found",
      });
    }

    variant.status = false;
    await variant.save();

    res.status(200).json({
      success: true,
      message: "Variant deleted",
    });
  } catch (error) {
    next(error);
  }
};
