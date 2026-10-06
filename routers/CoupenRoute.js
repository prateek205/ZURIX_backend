import express from "express";
import {
  applyCoupen,
  CreateCoupen,
  getAllCoupen,
  getCoupenByCode,
} from "../controllers/CoupenController.js";

const router = express.Router();

router.post("/createCoupen", CreateCoupen);
router.get("/getAllCoupen", getAllCoupen);
router.get("/getCoupenByCode/:code", getCoupenByCode);
router.post("/applyCoupon", applyCoupen);

export default router;
