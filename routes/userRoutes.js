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
} from "../controllers/userController.js";
import { auth, adminAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { registerSchema, loginSchema } from "../validations/authValidation.js";

const router = express.Router();

router.post("/register", validate(registerSchema), registerUser);
router.post("/login", validate(loginSchema), loginUser);
router.post("/logout",auth,logoutUser);
router.get("/profile",auth,getProfile);
router.put("/profile",auth,updateProfile);
router.put("/reset-password",auth,resetPassword);
router.post("/forgot-password",forgotPassword);
router.put("/reset-password/:token",resetPasswordByLink);


export default router;