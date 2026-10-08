import jwt from "jsonwebtoken";
import Admin from "../models/AdminModel";

export const adminProtectedRoute = async (req, res, next) => {
  try {
    const ADMIN_SECRET_KEY = process.env.ADMIN_JWT_SECRET;

    const token = req.cookies.adminToken;

    if (!token) {
      return res
        .status(404)
        .json({ success: false, message: "Admin login is required" });
    }

    const decode = jwt.verify(token, ADMIN_SECRET_KEY);

    const admin = await Admin.findById(decode.adminId).select("-password");

    if (!admin) {
      return res
        .status(409)
        .json({ success: false, message: "Admin not found" });
    }

    if (!admin.isActive) {
      return res
        .status(403)
        .json({ success: false, message: "Admin in not active" });
    }

    req.admin = decode;
    next();
  } catch (error) {
    console.log("ADMIN_ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
