import express from "express"
import { protectedRoute } from "../middleware/AuthMiddleware.js"
import { createAddress } from "../controllers/AddressController.js"

const router = express.router()


router.post("/createAddress", protectedRoute, createAddress)

export default router;