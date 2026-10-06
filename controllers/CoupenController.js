import Coupens from "../models/CoupenModel.js";

export const CreateCoupen = async (req, res) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscount,
      startDate,
      expireDate,
      usageLimit,
    } = req.body;

    if (
      !code ||
      !discountType ||
      discountValue === undefined ||
      !startDate ||
      !expireDate
    ) {
      return res
        .status(404)
        .json({ success: false, message: "All feilds are mandatory" });
    }

    if (!["PERCENTAGE", "FIXED"].includes(discountType)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Discount type" });
    }

    if (Number(discountValue) <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "discount must be greater than 0" });
    }

    if (discountType === "PERCENTAGE" && Number(discountValue) > 100) {
      return res.status(400).json({
        success: false,
        message: "discount value must not be exceed more than 100%",
      });
    }

    const start = new Date(startDate);
    const expire = new Date(expireDate);

    if (isNaN(start.getTime()) || isNaN(expire.getTime())) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid date format" });
    }

    if (expireDate <= startDate) {
      return res.status(400).json({
        success: false,
        message: "expire date must be after the start date",
      });
    }

    const existCoupen = await Coupens.findOne({
      code: code.toUpperCase(),
    });

    if (existCoupen) {
      return res
        .status(409)
        .json({ success: false, message: "coupen code already exists." });
    }

    const coupen = await Coupens.create({
      code: code.toUpperCase(),
      discountType,
      discountValue: Number(discountValue),
      minOrderAmount: Number(minOrderAmount) || 0,
      maxDiscount: maxDiscount !== undefined ? Number(maxDiscount) : undefined,
      startDate: start,
      expireDate: expire,
      usageLimit: usageLimit !== undefined ? Number(usageLimit) : undefined,
      usedCount: 0,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: "Coupen is create successfully!!!",
      data: coupen,
    });
  } catch (error) {
    console.log("COUPEN_CREATE_ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const getAllCoupen = async (req, res) => {
  try {
    const data = await Coupens.find().sort({ createdAt: -1 });

    if (!data) {
      return res
        .status(404)
        .json({ success: false, message: "Coupen not found" });
    }

    res.status(200).json({
      success: true,
      message: "Coupen fetch successfully",
      count: data.length,
      data: data,
    });
  } catch (error) {
    console.log("GET_COUPEN_DATA:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: message.error,
    });
  }
};

export const getCoupenByCode = async (req, res) => {
  try {
    const { code } = req.params;

    if (!code) {
      return res
        .status(404)
        .json({ success: false, message: "coupen code is required" });
    }

    const coupen = await Coupens.findOne({
      code: code.toUpperCase(),
    });

    if (!coupen) {
      return res
        .status(409)
        .json({ success: false, message: "Coupen not found" });
    }

    res.status(200).json({
      success: true,
      message: "Coupen fetch successfully!!!",
      data: coupen,
    });
  } catch (error) {
    console.log("COUPEN_DATA_ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: message.error,
    });
  }
};

export const applyCoupen = async (req, res) => {
  try {
    const { code, subtotal } = req.body;

    if (!code || subtotal === undefined) {
      return res.status(400).json({
        success: false,
        message: "coupenCode or subtotal amount is required...",
      });
    }

    const orderAmount = Number(subtotal);

    if (orderAmount <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid order amount" });
    }

    const coupen = await Coupens.findOne({
      code: code.toUpperCase(),
    });

    if (!coupen) {
      return res
        .status(400)
        .json({ success: false, message: "Coupen not found" });
    }

    if (!coupen.isActive) {
      return res
        .status(404)
        .json({ success: false, message: "Coupen is not active" });
    }

    const currentDate = new Date();

    if (currentDate < coupen.startDate) {
      return res
        .status(400)
        .json({ success: false, message: "coupen has not active" });
    }

    if (currentDate > coupen.expireDate) {
      return res
        .status(400)
        .json({ success: false, message: "coupen has expired" });
    }

    if (orderAmount < coupen.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `minimum order amount should be ${coupen.minOrderAmount}`,
      });
    }

    if (
      coupen.usageLimit !== undefined &&
      coupen.usedCount >= coupen.usageLimit
    ) {
      return res.status(404).json({
        success: false,
        message: "you have exceed the coupon limit...",
      });
    }

    let discountAmount = 0;

    if (coupen.discountType === "PERCENTAGE") {
      discountAmount = (orderAmount * coupen.discountValue) / 100;

      if (
        coupen.maxDiscount !== undefined &&
        discountAmount > coupen.maxDiscount
      ) {
        discountAmount = coupen.maxDiscount;
      }
    }

    if (coupen.discountType === "FIXED") {
      discountAmount = coupen.discountValue;

      if (discountAmount > orderAmount) {
        discountAmount = orderAmount;
      }
    }

    const finalAmount = orderAmount - discountAmount;

    res.status(200).json({
      success: true,
      message: "coupon applied successfully",
      data: {
        couponCode: coupen.code,
        discountType: coupen.discountType,
        discountValue: coupen.discountValue,
        discountAmount,
        subtotal: orderAmount,
        finalAmount,
      },
    });
  } catch (error) {
    console.log("APPLY_COUPON_ERROR", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: message.error,
    });
  }
};
