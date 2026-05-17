import express from "express";
import { auth } from "../middlewares/auth.js";
import {
  addToCart,
  getCart,
  updateCartQuantity,
  deleteCartItem,
} from "../controllers/cartController.js";

const router = express.Router();

// ADD ITEM
router.post("/add", auth, addToCart);

// GET CART
router.get("/", auth, getCart);

// UPDATE QUANTITY
router.put("/update", auth, updateCartQuantity);

// DELETE ITEM
router.delete("/item/:id", auth, deleteCartItem);

export default router;
