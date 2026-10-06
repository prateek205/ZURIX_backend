import express from "express";
import { CreateCoupen, getAllCoupen, getCoupenByCode } from "../controllers/CoupenController.js";

const router = express.Router();

router.post("/createCoupen", CreateCoupen);
router.get("/getAllCoupen", getAllCoupen);
router.get("/getCoupenByCode/:code", getCoupenByCode)

export default router;
