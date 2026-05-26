import SubCategory from "../../models/InventoryModels/subCategoryModel.js";
import Category from "../../models/InventoryModels/categoryModel.js";
import { buildImagePath, buildImageUrl } from "../../utils/fileUtils.js";
import { getPagination, buildSearchFilter } from "../../utils/pagination.js";

const parseStatus = (status, fallback = true) => {
  if (status === undefined || status === null || status === "") return fallback;
  if (typeof status === "boolean") return status;
  return status === "true" || status === "1";
};

export const createSubCategory = async (req, res, next) => {
  try {
    const { name, categoryId, status } = req.body;
    const image = buildImagePath(req.file);

    const category = await Category.findOne({
      where: {
        id: categoryId,
        status: true,
      },
    });

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Valid category is required",
      });
    }

    const subCategory = await SubCategory.create({
      name,
      categoryId,
      status: parseStatus(status),
      image,
    });

    const payload = subCategory.toJSON();
    payload.image = buildImageUrl(payload.image);
    payload.Category = category.toJSON();

    res.status(201).json({
      success: true,
      subCategory: payload,
    });
  } catch (error) {
    next(error);
  }
};

// GET ALL SUBCATEGORIES
export const getSubCategories = async (req, res, next) => {
  try {
    const { page, limit, offset, search } = getPagination(req);
    const where = {
      status: true,
      ...(search ? buildSearchFilter(search, ["name"]) : {}),
    };

    const { rows: subCategories, count } = await SubCategory.findAndCountAll({
      where,
      include: [
        {
          model: Category,
          attributes: ["id", "name", "image", "status"],
        },
      ],
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    const results = subCategories.map((subCategory) => {
      const payload = subCategory.toJSON();
      payload.image = buildImageUrl(payload.image);
      return payload;
    });

    res.status(200).json({
      success: true,
      page,
      limit,
      total: count,
      subCategories: results,
    });
  } catch (error) {
    next(error);
  }
};

// GET SINGLE SUBCATEGORY
export const getSingleSubCategory = async (req, res, next) => {
  try {
    const subCategory = await SubCategory.findOne({
      where: {
        id: req.params.id,
        status: true,
      },
      include: [
        {
          model: Category,
          attributes: ["id", "name", "image", "status"],
        },
      ],
    });

    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: "SubCategory not found",
      });
    }

    const payload = subCategory.toJSON();
    payload.image = buildImageUrl(payload.image);

    res.status(200).json({
      success: true,
      subCategory: payload,
    });
  } catch (error) {
    next(error);
  }
};

export const updateSubCategory = async (req, res, next) => {
  try {
    const subCategory = await SubCategory.findByPk(req.params.id);

    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: "SubCategory not found",
      });
    }

    const { name, categoryId, status } = req.body;

    if (categoryId) {
      const category = await Category.findOne({
        where: {
          id: categoryId,
          status: true,
        },
      });

      if (!category) {
        return res.status(400).json({
          success: false,
          message: "Valid category is required",
        });
      }
    }

    subCategory.name = name || subCategory.name;
    subCategory.categoryId = categoryId || subCategory.categoryId;
    subCategory.status = parseStatus(status, subCategory.status);

    if (req.file) {
      subCategory.image = buildImagePath(req.file);
    }

    await subCategory.save();

    const refreshed = await SubCategory.findByPk(subCategory.id, {
      include: [
        {
          model: Category,
          attributes: ["id", "name", "image", "status"],
        },
      ],
    });

    const payload = refreshed.toJSON();
    payload.image = buildImageUrl(payload.image);

    res.status(200).json({
      success: true,
      subCategory: payload,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSubCategory = async (req, res, next) => {
  try {
    const subCategory = await SubCategory.findByPk(req.params.id);

    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: "SubCategory not found",
      });
    }

    subCategory.status = false;
    await subCategory.save();

    res.status(200).json({
      success: true,
      message: "SubCategory deleted",
    });
  } catch (error) {
    next(error);
  }
};
