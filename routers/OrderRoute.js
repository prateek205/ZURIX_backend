import express from "express";
import {
  cancelOrder,
  createOrder,
  getAllOrder,
  getOrderById,
  getOrders,
} from "../controllers/OrderController.js";
import { protectedRoute } from "../middleware/AuthMiddleware.js";
import { adminProtectedRoute } from "../middleware/AdminMiddleware.js";

const router = express.Router();

router.post("/createOrder", protectedRoute, createOrder);
router.get("/getAllOrders", protectedRoute, getAllOrder);
router.get("/getOrderById/:id", protectedRoute, getOrderById);
router.delete("/cancelOrder/:id", protectedRoute, cancelOrder);

// ADMIN SIDE ORDERS
router.get("/get-Orders", adminProtectedRoute, getOrders);

export default router;