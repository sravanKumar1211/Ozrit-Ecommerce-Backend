import express from "express";
import { auth, adminAuth } from "../../middlewares/auth.js";
import upload from "../../uploads/upload.js";
import {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
  getSingleCategory,
} from "../../controllers/InventoryControllers/categoryController.js";

const router = express.Router();

router.post("/create", auth, adminAuth, upload.single("image"), createCategory);
router.get("/all", getCategories);
router.get("/all/:id", getSingleCategory);
router.put("/update/:id",auth,adminAuth,upload.single("image"),updateCategory);
router.delete("/delete/:id", auth, adminAuth, deleteCategory);

export default router;
