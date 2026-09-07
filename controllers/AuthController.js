import { useParams } from "react-router-dom";
import Auths from "../models/Auth.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT = process.env.SECRET_KEY;

// =======*************=======
// REGISTER BUSINESS LOGIC
// =======*************=======
export const register = async (req, res) => {
  try {
    // ********* Import from Model *********
    const { name, email, password } = req.body;

    // ********* validating the feilds *********
    if (!name || !email || !password) {
      return res
        .status(404)
        .json({ success: false, message: "All feilds are required..." });
    }

    // ********* checking the user already exists *********
    const userExists = await Auths.findOne({ email });
    if (userExists) {
      return res
        .status(404)
        .json({ success: false, message: "User already exists" });
    }

    // ********* hashed password *********
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await await bcrypt.hash(password, salt);

    // ********* creating the new user *********
    const newUser = new Auths({
      name,
      email,
      password: hashedPassword,
    });

    // ********* saving the user to DB *********
    await newUser.save();

    // ********* sending the response *********
    res
      .status(200)
      .json({ success: true, message: "Register successfully", data: newUser });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// =======*************=======
// LOGIN BUSINESS LOGIC
// =======*************=======

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ========= Validation for all feilds =========

    if (!email || !password) {
      return res
        .status(401)
        .json({ success: false, message: "All feilds are mandatory..." });
    }

    // ========== User already exists or not ==========

    const existsUser = await Auths.findOne({ email });
    if (!existsUser) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    // ========== user password matchs or not ==========

    const isMatch = await bcrypt.compare(password, existsUser.password);
    if (!isMatch) {
      return res
        .status(405)
        .json({ success: false, message: "Invalid Password" });
    }

    // ========== validate the token or cookies ==========
    const token = await jwt.sign({ user: existsUser._id }, JWT, {
      expiresIn: "1d",
    });

    res.cookie("userToken", token, {
      httpOnly: true,
      secure:false,
      sameSite:"lax",
      path:"/"
    });

    // ========== Response for user side ==========

    res
      .status(200)
      .json({ success: true, message: "Login Successfull", user: existsUser, token:token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// =======*************=======
// GET PROFILE BUSINESS LOGIC
// =======*************=======

export const getProfile = async (req, res) => {
  try {
    // ========== Get profile data ==========
    const profile = await Auths.find();

    // ========== response for user side ==========

    res.status(200).json({
      success: true,
      message: "Profile fetch successfully!!!",
      count: profile.length,
      data: profile,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// =======*************=======
// LOGOUT BUSINESS LOGIC
// =======*************=======

export const logout = async (req, res) => {
  try {
    res.clearCookie("userToken",{
        httpOnly:true,
        secure:false,
        sameSite:"lax",
        path:"/"
    })
    res
      .status(200)
      .json({ success: true, message: "User Logout Successfully!!!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
