import { Op } from "sequelize";
import Coupon from "../models/couponModel.js";

// CREATE COUPON
export const createCoupon = async (req, res, next) => {
  try {
    const { couponCode, discountType, discountValue, expiryDate, minPurchaseAmount, status } = req.body;

    if (!couponCode || !discountType || discountValue === undefined || !expiryDate) {
      return res.status(400).json({
        success: false,
        message: "couponCode, discountType, discountValue, and expiryDate are required",
      });
    }

    const normalizedDiscountType = discountType.toLowerCase();
    if (!["flat", "percent"].includes(normalizedDiscountType)) {
      return res.status(400).json({
        success: false,
        message: "discountType must be either 'flat' or 'percent'",
      });
    }

    const existingCoupon = await Coupon.findOne({
      where: { couponCode },
    });

    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: "Coupon already exists",
      });
    }

    const coupon = await Coupon.create({
      couponCode,
      discountType: normalizedDiscountType,
      discountValue,
      expiryDate,
      minPurchaseAmount,
      status,
    });

    res.status(201).json({
      success: true,
      coupon,
    });
  } catch (error) {
    next(error);
  }
};

// GET ALL COUPONS
export const getCoupons = async (req, res, next) => {
  try {
    const search = req.query.search ? req.query.search.trim() : null;
    const where = search
      ? {
          [Op.or]: [
            { couponCode: { [Op.like]: `%${search}%` } },
            { discountType: { [Op.like]: `%${search}%` } },
          ],
        }
      : {};

    const coupons = await Coupon.findAll({ where });

    res.status(200).json({
      success: true,
      coupons,
    });
  } catch (error) {
    next(error);
  }
};

// APPLY COUPON
export const applyCoupon = async (req, res, next) => {
  try {
    const { couponCode, totalAmount } = req.body;

    if (!couponCode) {
      return res.status(400).json({
        success: false,
        message: "Coupon code is required",
      });
    }

    const amount = parseFloat(totalAmount);
    if (isNaN(amount) || amount < 0) {
      return res.status(400).json({
        success: false,
        message: "Valid total amount is required",
      });
    }

    const coupon = await Coupon.findOne({
      where: { couponCode, status: true },
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found or inactive",
      });
    }

    if (new Date(coupon.expiryDate) < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Coupon has expired",
      });
    }

    if (amount < parseFloat(coupon.minPurchaseAmount || 0)) {
      return res.status(400).json({
        success: false,
        message: `Minimum purchase amount of ${coupon.minPurchaseAmount} is required to apply this coupon`,
      });
    }

    let discount = parseFloat(coupon.discountValue);
    if (coupon.discountType === "percent") {
      discount = Math.min((amount * discount) / 100, amount);
    }

    const discountedTotal = parseFloat(Math.max(amount - discount, 0).toFixed(2));

    res.status(200).json({
      success: true,
      coupon: {
        id: coupon.id,
        couponCode: coupon.couponCode,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        expiryDate: coupon.expiryDate,
        minPurchaseAmount: coupon.minPurchaseAmount,
      },
      totalAmount: parseFloat(amount.toFixed(2)),
      discount: parseFloat(discount.toFixed(2)),
      discountedTotal,
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE COUPON
export const updateCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    const { couponCode, discountType, discountValue, expiryDate, minPurchaseAmount, status } = req.body;

    if (couponCode && couponCode !== coupon.couponCode) {
      const existingCoupon = await Coupon.findOne({ where: { couponCode } });
      if (existingCoupon) {
        return res.status(400).json({ success: false, message: "Another coupon already uses this code" });
      }
      coupon.couponCode = couponCode;
    }

    if (discountType) {
      const normalizedDiscountType = discountType.toLowerCase();
      if (!["flat", "percent"].includes(normalizedDiscountType)) {
        return res.status(400).json({
          success: false,
          message: "discountType must be either 'flat' or 'percent'",
        });
      }
      coupon.discountType = normalizedDiscountType;
    }

    coupon.discountValue = discountValue ?? coupon.discountValue;
    coupon.expiryDate = expiryDate || coupon.expiryDate;
    coupon.minPurchaseAmount = minPurchaseAmount ?? coupon.minPurchaseAmount;
    coupon.status = status ?? coupon.status;

    await coupon.save();

    res.status(200).json({
      success: true,
      message: "Coupon updated",
      coupon,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE COUPON
export const deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    coupon.status = false;
    await coupon.save();

    res.status(200).json({
      success: true,
      message: "Coupon deleted",
    });
  } catch (error) {
    next(error);
  }
};
