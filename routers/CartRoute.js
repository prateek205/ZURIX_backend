import express from "express";
import {
  addToCart,
  getAllCart,
  removeCartItem,
  updateCartItem,
} from "../controllers/CartController.js";
import { protectedRoute } from "../middleware/AuthMiddleware.js";

const router = express.Router();

router.post("/addToCart", protectedRoute, addToCart);
router.get("/getAllCarts", protectedRoute, getAllCart);
router.put("/updateCart/:itemId", protectedRoute, updateCartItem);
router.delete("/removeCart/:itemId", protectedRoute, removeCartItem);

export default router;
