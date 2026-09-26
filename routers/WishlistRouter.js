import express from "express"
import { protectedRoute } from "../middleware/AuthMiddleware.js";
import { createWishlist } from "../controllers/WishlistController.js";

const router = express.Router()

router.post("/createWishlist", protectedRoute, createWishlist)

export default router;