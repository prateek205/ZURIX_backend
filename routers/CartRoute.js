import express from "express";
import {
  addToCart,
  getAllCart,
  removeCartItem,
  updateCartItem,
} from "../controllers/CartController.js";

const router = express.Router();

router.post("/addToCart", addToCart);
router.get("/getCart", getAllCart);
router.put("/updateCart", updateCartItem);
router.delete("/removeCart", removeCartItem);

export default router;
