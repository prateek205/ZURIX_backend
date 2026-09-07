import jwt from "jsonwebtoken";

export const protectedRoute = async (req, res, next) => {
  const JWT = process.env.SECRET_KEY;
  try {
    const token = req.cookies.userToken;

    if (!token) {
      return res.status(400).json({ success: false, message: "Login First" });
    }

    const decode = jwt.verify(token, JWT);

    req.existsUser = decode;

    next();
  } catch (error) {
    console.log("PROTECTED_ROUTE:",error)
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
