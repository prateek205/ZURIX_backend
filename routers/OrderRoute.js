import express from "express";
import {
  cancelOrder,
  createOrder,
  getAllOrder,
  getOrderById,
} from "../controllers/OrderController.js";
import { protectedRoute } from "../middleware/AuthMiddleware.js";

const router = express.Router();

router.post("/createOrder", protectedRoute, createOrder);
router.get("/getAllOrders", protectedRoute, getAllOrder);
router.get("/getOrderById/:id", protectedRoute, getOrderById);
router.delete("/cancelOrder/:id", protectedRoute, cancelOrder);

export default router;