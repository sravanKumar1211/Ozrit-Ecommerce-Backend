import express from "express";
import { auth, adminAuth } from "../../middlewares/auth.js";
import upload from "../../uploads/upload.js";
import {
  createProduct,
  getProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
} from "../../controllers/InventoryControllers/productController.js";

const router = express.Router();

// CREATE
router.post("/create",auth,adminAuth,upload.single("thumbnail"),createProduct);
// GET ALL
router.get("/all", getProducts);
// GET SINGLE
router.get("/:id", getSingleProduct);
// UPDATE
router.put("/update/:id",auth,adminAuth,upload.single("thumbnail"),updateProduct);
// DELETE
router.delete("/delete/:id", auth, adminAuth, deleteProduct);

export default router;
