import { Op } from "sequelize";
import Product from "../../models/InventoryModels/productModel.js";
import Category from "../../models/InventoryModels/categoryModel.js";
import SubCategory from "../../models/InventoryModels/subCategoryModel.js";
import Brand from "../../models/InventoryModels/brandModel.js";
import { buildImagePath, buildImageUrl } from "../../utils/fileUtils.js";
import { getPagination, buildSearchFilter } from "../../utils/pagination.js";

// CREATE PRODUCT
export const createProduct = async (req, res, next) => {
  try {
    const { categoryId, subCategoryId, brandId, name, description, status } = req.body;
    const thumbnail = buildImagePath(req.file);

    const product = await Product.create({
      categoryId,
      subCategoryId,
      brandId,
      name,
      description,
      status,
      thumbnail,
    });

    const payload = product.toJSON();
    payload.thumbnail = buildImageUrl(payload.thumbnail);

    res.status(201).json({
      success: true,
      product: payload,
    });
  } catch (error) {
    next(error);
  }
};

// GET ALL PRODUCTS
export const getProducts = async (req, res, next) => {
  try {
    const { page, limit, offset, search } = getPagination(req);
    const where = {
      status: true,
      ...(search ? buildSearchFilter(search, ["name"]) : {}),
    };

    const { rows: products, count } = await Product.findAndCountAll({
      where,
      include: [Category, SubCategory, Brand],
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    const results = products.map((product) => {
      const payload = product.toJSON();
      payload.thumbnail = buildImageUrl(payload.thumbnail);
      return payload;
    });

    res.status(200).json({
      success: true,
      page,
      limit,
      total: count,
      products: results,
    });
  } catch (error) {
    next(error);
  }
};

// GET SINGLE PRODUCT
export const getSingleProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      where: {
        id: req.params.id,
        status: true,
      },
      include: [Category, SubCategory, Brand],
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const payload = product.toJSON();
    payload.thumbnail = buildImageUrl(payload.thumbnail);

    res.status(200).json({
      success: true,
      product: payload,
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE PRODUCT
export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const { categoryId, subCategoryId, brandId, name, description, status } = req.body;
    product.categoryId = categoryId || product.categoryId;
    product.subCategoryId = subCategoryId || product.subCategoryId;
    product.brandId = brandId || product.brandId;
    product.name = name || product.name;
    product.description = description || product.description;
    product.status = status ?? product.status;

    if (req.file) {
      product.thumbnail = buildImagePath(req.file);
    }

    await product.save();

    const payload = product.toJSON();
    payload.thumbnail = buildImageUrl(payload.thumbnail);

    res.status(200).json({
      success: true,
      message: "Product updated",
      product: payload,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE PRODUCT
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    product.status = false;
    await product.save();

    res.status(200).json({
      success: true,
      message: "Product deleted",
    });
  } catch (error) {
    next(error);
  }
};
