import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import Admin from "../models/AdminModel.js";
import crypto from "node:crypto";
import { sendEmail } from "../utils/mailer.js";

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
  const ADMIN_SECRET_KEY = process.env.ADMIN_JWT_SECRET;

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
      ADMIN_SECRET_KEY,
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
      data: {
        adminId: req.admin._id,
        name: req.admin.name,
        email: req.admin.email,
        role: req.admin.role,
      },
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

export const adminLogout = async (req, res) => {
  try {
    res.clearCookie("adminToken", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    res
      .status(200)
      .json({ success: true, message: "Admin Logout Successfully!!!" });
  } catch (error) {
    console.log("ADMIN_LOGOUT_ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const adminForgotPassword = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const admin = await Admin.findOne({
      email,
      isActive: true,
    });

    const message =
      "If an active admin account exists for this email, a reset link will be sent.";

    if (!admin) {
      return res.status(200).json({
        success: true,
        message,
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    admin.resetPasswordToken = hashedToken;
    admin.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);

    await admin.save();

    const resetLink =
      `${process.env.ADMIN_PANEL_URL}/reset-password` +
      `?token=${resetToken}`;

    try {
      await sendEmail({
        to: admin.email,
        subject: "Admin Password Reset",
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>Reset Your Admin Password</h2>
            <p>Hello ${admin.name},</p>
            <p>We received a request to reset your admin password.</p>
            <p>This link expires in 15 minutes and can only be used once.</p>
            <a
              href="${resetLink}"
              style="display:inline-block;padding:12px 20px;background:#111;color:#fff;text-decoration:none;border-radius:6px;"
            >
              Reset Password
            </a>
            <p>If you did not request this, you can ignore this email.</p>
          </div>
        `,
      });
    } catch (emailError) {
      admin.resetPasswordToken = undefined;
      admin.resetPasswordExpires = undefined;
      await admin.save();

      throw emailError;
    }

    return res.status(200).json({
      success: true,
      message,
    });
  } catch (error) {
    console.error("ADMIN_FORGOT_PASSWORD_ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to process the password reset request",
    });
  }
};

export const adminResetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const admin = await Admin.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
      isActive: true,
    }).select("+resetPasswordToken +resetPasswordExpires");

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Reset link is invalid or has expired",
      });
    }

    admin.password = await bcrypt.hash(password, 10);

    admin.set("resetPasswordToken", undefined);
    admin.set("resetPasswordExpires", undefined);

    await admin.save();

    return res.status(200).json({
      success: true,
      message: "Admin password reset successfully. Please log in.",
    });
  } catch (error) {
    console.error("ADMIN_RESET_PASSWORD_ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to reset password",
    });
  }
};
