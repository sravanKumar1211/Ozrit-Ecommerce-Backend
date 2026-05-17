import express from "express";
import {
  auth,
  adminAuth,
} from "../../middlewares/auth.js";
import upload from "../../uploads/upload.js";
import {
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
  getSubCategories,
  getSingleSubCategory,
} from "../../controllers/InventoryControllers/subCategoryController.js";

const router = express.Router();

// CREATE
router.post("/create",auth,adminAuth,upload.single("image"),createSubCategory);
// UPDATE
router.put("/update/:id",auth,adminAuth,upload.single("image"),updateSubCategory);
// DELETE
router.delete("/delete/:id",auth,adminAuth,deleteSubCategory);
//GET
router.get("/all",getSubCategories);
router.get("/all/:id",getSingleSubCategory);

export default router;