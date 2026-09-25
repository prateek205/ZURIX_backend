import express from "express";

import {
  createRazorpayOrder,
  verifyRazorpayPayment,
} from "../controllers/paymentController.js";
import { protectedRoute } from "../middleware/AuthMiddleware.js";

const router = express.Router();

router.post("/create-order", protectedRoute, createRazorpayOrder);
router.post("/verify-payment", protectedRoute, verifyRazorpayPayment);

export default router;
