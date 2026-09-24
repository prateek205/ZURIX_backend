import express from "express";

import { createRazorpayOrder } from "../controllers/paymentController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create-order", authMiddleware, createRazorpayOrder);

export default router;
