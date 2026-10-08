import Admin from "../models/AdminModel.js";

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "All feilds are required...." });
    }

    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res
        .status(409)
        .json({ success: false, message: "Admin not found" });
    }

    res.status(201).json({
      success: true,
      message: "Admin login successfully!!!",
      data: admin,
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
