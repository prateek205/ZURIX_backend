import express from "express";

import { createRazorpayOrder } from "../controllers/paymentController.js";
import { protectedRoute } from "../middleware/AuthMiddleware.js";

const router = express.Router();

router.post("/create-order", protectedRoute, createRazorpayOrder);

export default router;
