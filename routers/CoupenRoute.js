import express from "express";
import {
  applyCoupen,
  CreateCoupen,
  deleteCoupon,
  getAllCoupen,
  getCoupenByCode,
  updateCoupon,
} from "../controllers/CoupenController.js";

const router = express.Router();

router.post("/createCoupen", CreateCoupen);
router.get("/getAllCoupen", getAllCoupen);
router.get("/getCoupenByCode/:code", getCoupenByCode);
router.post("/applyCoupon", applyCoupen);
router.put("/updateCoupon/:id", updateCoupon);
router.delete("/deleteCoupon/:id", deleteCoupon)

export default router;
