import express from "express"
import { CreateCoupen } from "../controllers/CoupenController.js"

const router = express.Router()

router.post("/createRouter", CreateCoupen)

export default router;