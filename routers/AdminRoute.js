import express from "express";
import { adminLogin, getAdminProfile } from "../controllers/AdminController.js";
import { adminProtectedRoute } from "../middleware/AdminMiddleware.js";

const router = express.Router();

router.post("/adminLogin", adminLogin);
router.get("/getAdminProfile", adminProtectedRoute, getAdminProfile);

export default router;
