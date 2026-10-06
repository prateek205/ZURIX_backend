import express from "express";
import { CreateCoupen, getAllCoupen } from "../controllers/CoupenController.js";

const router = express.Router();

router.post("/createCoupen", CreateCoupen);
router.get("/getAllCoupen", getAllCoupen);

export default router;
