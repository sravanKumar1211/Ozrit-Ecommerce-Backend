import express from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getProfile,
  updateProfile,
  resetPassword,
  forgotPassword,
  resetPasswordByLink,
  getAllUsers,
  verifyOtp,
  resendOtp,
} from "../controllers/userController.js";
import { getDashboardStats } from "../controllers/dashboardController.js";
import { auth, adminAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { registerSchema, loginSchema } from "../validations/authValidation.js";
import upload from "../uploads/upload.js";

const router = express.Router();

router.post("/register", validate(registerSchema), registerUser);
router.post("/login", validate(loginSchema), loginUser);
router.post("/logout", auth, logoutUser);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.get("/profile", auth, getProfile);
router.put("/profile", auth, upload.single("profileImage"), updateProfile);
router.get("/admin/users", auth, adminAuth, getAllUsers);
router.put("/reset-password", auth, resetPassword);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPasswordByLink);


//Admin
router.get("/admin/dashboard",auth,adminAuth, getDashboardStats);


export default router;
