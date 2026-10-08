import express from "express";
import { adminLogin, adminLogout, adminRegister, getAdminProfile } from "../controllers/AdminController.js";
import { adminProtectedRoute } from "../middleware/AdminMiddleware.js";

const router = express.Router();

router.post("/registerAdmin", adminRegister)
router.post("/adminLogin", adminLogin);
router.get("/getAdminProfile", adminProtectedRoute, getAdminProfile);
router.post("/adminLogout", adminLogout)

export default router;
