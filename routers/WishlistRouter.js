import express from "express"
import { protectedRoute } from "../middleware/AuthMiddleware.js";
import { createWishlist, deleteWishlist, getAllWishlist } from "../controllers/WishlistController.js";

const router = express.Router()

router.post("/createWishlist", protectedRoute, createWishlist)
router.get("/getAllWishlist", protectedRoute, getAllWishlist)
router.delete("/deleteWishlist/:id", protectedRoute, deleteWishlist)

export default router;