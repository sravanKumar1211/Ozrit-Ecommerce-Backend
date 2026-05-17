import express from "express";
import { auth, adminAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { couponSchema } from "../validations/couponValidation.js";
import {
  createCoupon,
  getCoupons,
  updateCoupon,
  deleteCoupon,
  applyCoupon,
} from "../controllers/couponController.js";

const router = express.Router();

// ADMIN
router.post("/create", auth, adminAuth, validate(couponSchema), createCoupon);
router.get("/all", auth, adminAuth, getCoupons);
router.put("/update/:id", auth, adminAuth, validate(couponSchema), updateCoupon);
router.delete("/delete/:id", auth, adminAuth, deleteCoupon);

// USER
router.post("/apply", auth, applyCoupon);

export default router;
