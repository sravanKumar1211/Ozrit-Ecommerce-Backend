import express from "express";
import {auth,adminAuth,} from "../../middlewares/auth.js";
import upload from "../../uploads/upload.js";
import {
  createBrand,
  updateBrand,
  deleteBrand,
  getBrands,
  getSingleBrand,
} from "../../controllers/InventoryControllers/brandController.js";

const router =express.Router();

// CREATE
router.post("/create",auth,adminAuth,upload.single("logo"),createBrand);
// UPDATE
router.put("/update/:id",auth,adminAuth,upload.single("logo"),updateBrand);
// DELETE
router.delete("/delete/:id",auth,adminAuth,deleteBrand);
// GET 
router.get("/all", getBrands);
router.get("/all/:id", getSingleBrand);

export default router;