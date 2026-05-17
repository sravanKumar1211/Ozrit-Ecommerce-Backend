import express from "express";
import { auth, adminAuth } from "../../middlewares/auth.js";
import upload from "../../uploads/upload.js";
import {
  createVariant,
  getVariants,
  getSingleVariant,
  updateVariant,
  deleteVariant,
} from "../../controllers/InventoryControllers/productVariantController.js";

const router = express.Router();

// CREATE
router.post("/create", auth, adminAuth, upload.single("image"), createVariant);

// GET ALL
router.get("/all", getVariants);

// GET SINGLE
router.get("/:id", getSingleVariant);

// UPDATE
router.put("/update/:id",auth,adminAuth,upload.single("image"),updateVariant);

// DELETE
router.delete("/delete/:id", auth, adminAuth, deleteVariant);

export default router;
