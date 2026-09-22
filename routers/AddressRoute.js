import express from "express";
import { protectedRoute } from "../middleware/AuthMiddleware.js";
import {
  createAddress,
  getAllAddress,
} from "../controllers/AddressController.js";

const router = express.Router();

router.post("/createAddress", protectedRoute, createAddress);
router.get("/getAllAddress", protectedRoute, getAllAddress);

export default router;
