import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectdb } from "./config/db.js";
import cookieParser from "cookie-parser";
import AuthRoutes from "./routers/AuthRoute.js"
import ProductRoute from "./routers/ProductRoute.js"
import CategoryRoute from "./routers/CategoryRoute.js"

dotenv.config();

// ===== DOTENV PORT =====

const PORT = process.env.SERVER_PORT || 5000;

// ===== MONGODB CONNECTION =====

connectdb();

// ===== EXPRESS SERVER =====

const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser())

// ===== ROUTES =====

app.use("/api/v1/auth", AuthRoutes)
app.use("/api/v1/products", ProductRoute)
app.use("/api/v1/category",CategoryRoute)

// ===== SERVER LISTENING PORT =====

app.listen(PORT, () =>
  console.log(`The Server is running on port: http://localhost:${PORT}`),
);
