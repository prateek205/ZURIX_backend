import express from "express"
import { CreateCoupen } from "../controllers/CoupenController.js"

const router = express.Router()

router.post("/createCoupen", CreateCoupen)

export default router;