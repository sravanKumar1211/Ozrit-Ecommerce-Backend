import { Op } from "sequelize";

export const getPagination = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit, 10) || 20, 1);
  const offset = (page - 1) * limit;
  const search = req.query.search ? req.query.search.trim() : null;

  return { page, limit, offset, search };
};

export const buildSearchFilter = (search, fields) => {
  if (!search || !fields.length) return {};

  return {
    [Op.or]: fields.map((field) => ({
      [field]: {
        [Op.like]: `%${search}%`,
      },
    })),
  };
};
