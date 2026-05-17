import { Op } from "sequelize";
import Category from "../../models/InventoryModels/categoryModel.js";
import { buildImagePath, buildImageUrl } from "../../utils/fileUtils.js";
import { getPagination, buildSearchFilter } from "../../utils/pagination.js";

// CREATE
export const createCategory = async (req, res, next) => {
  try {
    const { name, status } = req.body;
    const image = buildImagePath(req.file);

    const category = await Category.create({
      name,
      status,
      image,
    });

    const payload = category.toJSON();
    payload.image = buildImageUrl(payload.image);
    

    res.status(201).json({
      success: true,
      category: payload,
    });
  } catch (error) {
    next(error);
  }
};

// GET ALL
export const getCategories = async (req, res, next) => {
  try {
    const { page, limit, offset, search } = getPagination(req);
    const where = {
      status: true,
      ...(search ? buildSearchFilter(search, ["name"]) : {}),
    };

    const { rows: categories, count } = await Category.findAndCountAll({
      where,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    const results = categories.map((category) => {
      const payload = category.toJSON();
      payload.image = buildImageUrl(payload.image);
      return payload;
    });

    res.status(200).json({
      success: true,
      page,
      limit,
      total: count,
      categories: results,
    });
  } catch (error) {
    next(error);
  }
};

// GET SINGLE CATEGORY
export const getSingleCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      where: {
        id: req.params.id,
        status: true,
      },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const payload = category.toJSON();
    payload.image = buildImageUrl(payload.image);

    res.status(200).json({
      success: true,
      category: payload,
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE
export const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const { name, status } = req.body;
    category.name = name || category.name;
    category.status = status ?? category.status;

    if (req.file) {
      category.image = buildImagePath(req.file);
    }

    await category.save();

    const payload = category.toJSON();
    payload.image = buildImageUrl(payload.image);

    res.status(200).json({
      success: true,
      message: "Category updated",
      category: payload,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE
export const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    category.status = false;
    await category.save();

    res.status(200).json({
      success: true,
      message: "Category deleted",
    });
  } catch (error) {
    next(error);
  }
};
