import express from "express"
import { getAllCustomers, getProfile, login, logout, register } from "../controllers/AuthController.js";
import { protectedRoute } from "../middleware/AuthMiddleware.js";
import { adminProtectedRoute } from "../middleware/AdminMiddleware.js";

const routes = express.Router()


routes.post("/register", register)
routes.post("/login", login)
routes.get("/getProfile", protectedRoute, getProfile)
routes.post("/logout", logout)

// Admin-only customer list
routes.get("/getAllCustomers", adminProtectedRoute, getAllCustomers);

export default routes;