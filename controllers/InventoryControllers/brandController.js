import Brand from "../../models/InventoryModels/brandModel.js";
import { buildImagePath, buildImageUrl } from "../../utils/fileUtils.js";
import { getPagination, buildSearchFilter } from "../../utils/pagination.js";

const parseStatus = (status, fallback = true) => {
  if (status === undefined || status === null || status === "") return fallback;
  if (typeof status === "boolean") return status;
  return status === "true" || status === "1";
};

export const createBrand = async (req, res, next) => {
  try {
    const { name, status } = req.body;
    const logo = buildImagePath(req.file);

    const brand = await Brand.create({
      name,
      status: parseStatus(status),
      logo,
    });

    const payload = brand.toJSON();
    payload.logo = buildImageUrl(payload.logo);

    res.status(201).json({
      success: true,
      brand: payload,
    });
  } catch (error) {
    next(error);
  }
};

// GET ALL BRANDS
export const getBrands = async (req, res, next) => {
  try {
    const { page, limit, offset, search } = getPagination(req);
    const where = {
      status: true,
      ...(search ? buildSearchFilter(search, ["name"]) : {}),
    };

    const { rows: brands, count } = await Brand.findAndCountAll({
      where,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    const results = brands.map((brand) => {
      const payload = brand.toJSON();
      payload.logo = buildImageUrl(payload.logo);
      return payload;
    });

    res.status(200).json({
      success: true,
      page,
      limit,
      total: count,
      brands: results,
    });
  } catch (error) {
    next(error);
  }
};

// GET SINGLE BRAND
export const getSingleBrand = async (req, res, next) => {
  try {
    const brand = await Brand.findOne({
      where: {
        id: req.params.id,
        status: true,
      },
    });

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    const payload = brand.toJSON();
    payload.logo = buildImageUrl(payload.logo);

    res.status(200).json({
      success: true,
      brand: payload,
    });
  } catch (error) {
    next(error);
  }
};

export const updateBrand = async (req, res, next) => {
  try {
    const brand = await Brand.findByPk(req.params.id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    const { name, status } = req.body;
    brand.name = name || brand.name;
    brand.status = parseStatus(status, brand.status);

    if (req.file) {
      brand.logo = buildImagePath(req.file);
    }

    await brand.save();

    const payload = brand.toJSON();
    payload.logo = buildImageUrl(payload.logo);

    res.status(200).json({
      success: true,
      brand: payload,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBrand = async (req, res, next) => {
  try {
    const brand = await Brand.findByPk(req.params.id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    brand.status = false;
    await brand.save();

    res.status(200).json({
      success: true,
      message: "Brand deleted",
    });
  } catch (error) {
    next(error);
  }
};
