import express from "express"
import { getProfile, login, logout, register } from "../controllers/AuthController.js";
import { protectedRoute } from "../middleware/AuthMiddleware.js";

const routes = express.Router()


routes.post("/register", register)
routes.post("/login", login)
routes.get("/getProfile", protectedRoute, getProfile)
routes.post("/logout", logout)


export default routes;