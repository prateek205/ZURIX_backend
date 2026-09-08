import express from "express";
import {
  cancelOrder,
  createOrder,
  getAllOrder,
  getOrderById,
} from "../controllers/OrderController";

const router = express.Router();

router.post("/createOrder", createOrder);
router.get("/getAllOrders", getAllOrder);
router.get("/getOrderById", getOrderById);
router.delete("/cancelOrder", cancelOrder);

export default router;
