import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import Admin from "../models/AdminModel.js";

export const adminRegister = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(404)
        .json({ success: false, message: "All feilds are mandatory" });
    }

    const existAdmin = await Admin.findOne({ email });

    if (existAdmin) {
      return res
        .status(400)
        .json({ success: false, message: "Admin already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await Admin.create({
      name: name,
      email: email,
      password: hashedPassword,
      role: "ADMIN",
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: "Admin created Successfully!!!",
      data: admin,
    });
  } catch (error) {
    console.log("ADMIN_CREATED_ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const adminLogin = async (req, res) => {
  const ADMIN_TOKEN = process.env.ADMIN_JWT_SECRET;

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "All feilds are required...." });
    }

    const admin = await Admin.findOne({ email: email });

    console.log("ADMIN_FOUND:", admin);

    if (!admin) {
      return res
        .status(409)
        .json({ success: false, message: "Admin not found" });
    }

    if (!admin.isActive) {
      return res
        .status(403)
        .json({ success: false, message: "Admin is not active" });
    }

    const isPasswordMatch = await bcrypt.compare(password, admin.password);

    if (!isPasswordMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Password does not match" });
    }

    const token = jwt.sign(
      { adminId: admin._id, role: admin.role },
      ADMIN_TOKEN,
      { expiresIn: "1d" },
    );

    res.cookie("adminToken", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    res.status(200).json({
      success: true,
      message: "Admin login successfully!!!",
      data: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.log("ADMIN_LOGIN_ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const getAdminProfile = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Profile get successfully!!!",
      data: req.admin,
    });
  } catch (error) {
    console.log("GET_PROFILE_ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
