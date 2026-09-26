import express from "express"
import { protectedRoute } from "../middleware/AuthMiddleware.js";
import { createWishlist, getAllWishlist, updateWishlist } from "../controllers/WishlistController.js";

const router = express.Router()

router.post("/createWishlist", protectedRoute, createWishlist)
router.get("/getAllWishlist", protectedRoute, getAllWishlist)
router.put("/updateWishlist/:id", protectedRoute, updateWishlist)

export default router;