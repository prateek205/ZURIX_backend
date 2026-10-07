import Cart from "../models/CartModel.js";
import Product from "../models/ProductMngmt.js";
import razorpay from "../config/razorpay.js";
import Order from "../models/OrderModel.js";
import crypto from "crypto";

const SECRET_KEY = process.env.RAZORPAY_KEY_SECRET;

export const createRazorpayOrder = async (req, res) => {
  try {
    const { couponCode } = req.body;

    console.log("RAZORPAY CREATE ORDER API HIT");
    console.log("COUPON CODE:", couponCode);
    console.log("USER:", req.existsUser);

    const cart = await Cart.findOne({
      user: req.existsUser.user,
    });

    if (!cart) {
      return res.status(400).json({
        success: false,
        message: "Cart not found",
      });
    }

    if (!cart.items || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    // --------------------------------
    // 1. Calculate cart subtotal
    // --------------------------------

    let subtotal = 0;

    for (const cartItem of cart.items) {
      const product = await Product.findById(cartItem.productId);

      if (!product) {
        return res.status(400).json({
          success: false,
          message: "Product not found",
        });
      }

      if (product.isActive === false) {
        return res.status(400).json({
          success: false,
          message: `${product.name} is currently unavailable`,
        });
      }

      if (product.stock < cartItem.quantity) {
        return res.status(400).json({
          success: false,
          message: `Product stock is not available for ${product.name}`,
        });
      }

      const itemTotal = Number(product.salePrice) * Number(cartItem.quantity);

      subtotal += itemTotal;
    }

    // --------------------------------
    // 2. Calculate coupon discount
    // --------------------------------

    let discountAmount = 0;
    let appliedCoupon = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.trim().toUpperCase(),
      });

      if (!coupon) {
        return res.status(400).json({
          success: false,
          message: "Coupon not found",
        });
      }

      // Check active status
      if (!coupon.isActive) {
        return res.status(400).json({
          success: false,
          message: "Coupon is not active",
        });
      }

      // Check start date
      const currentDate = new Date();

      if (currentDate < coupon.startDate) {
        return res.status(400).json({
          success: false,
          message: "Coupon is not active yet",
        });
      }

      // Check expiry
      if (currentDate > coupon.expiryDate) {
        return res.status(400).json({
          success: false,
          message: "Coupon has expired",
        });
      }

      // Check minimum order amount
      if (subtotal < coupon.minimumOrderAmount) {
        return res.status(400).json({
          success: false,
          message: `Minimum order amount should be ₹${coupon.minimumOrderAmount}`,
        });
      }

      // Check usage limit
      if (
        coupon.usageLimit !== undefined &&
        coupon.usedCount >= coupon.usageLimit
      ) {
        return res.status(400).json({
          success: false,
          message: "Coupon usage limit has been reached",
        });
      }

      // --------------------------------
      // Calculate discount
      // --------------------------------

      if (coupon.discountType === "PERCENTAGE") {
        discountAmount = (subtotal * coupon.discountValue) / 100;

        if (
          coupon.maximumDiscount !== undefined &&
          discountAmount > coupon.maximumDiscount
        ) {
          discountAmount = coupon.maximumDiscount;
        }
      }

      if (coupon.discountType === "FIXED") {
        discountAmount = coupon.discountValue;

        if (discountAmount > subtotal) {
          discountAmount = subtotal;
        }
      }

      appliedCoupon = coupon;
    }

    // --------------------------------
    // 3. Calculate shipping
    // --------------------------------

    const shippingCharges = subtotal >= 1000 ? 0 : 100;

    // --------------------------------
    // 4. Calculate final amount
    // --------------------------------

    const totalAmount = subtotal - discountAmount + shippingCharges;

    console.log("SUBTOTAL:", subtotal);
    console.log("DISCOUNT:", discountAmount);
    console.log("SHIPPING:", shippingCharges);
    console.log("FINAL TOTAL:", totalAmount);

    // --------------------------------
    // 5. Convert INR to paise
    // --------------------------------

    const razorpayAmount = Math.round(totalAmount * 100);

    // --------------------------------
    // 6. Create Razorpay order
    // --------------------------------

    const razorpayOrder = await razorpay.orders.create({
      amount: razorpayAmount,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: req.existsUser.user.toString(),
        couponCode: appliedCoupon?.code || "",
        discountAmount: discountAmount.toString(),
      },
    });

    console.log("RAZORPAY ORDER:", razorpayOrder);

    return res.status(200).json({
      success: true,
      message: "Razorpay order created successfully",
      data: {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,

        subtotal,
        discountAmount,
        shippingCharges,
        totalAmount,

        couponCode: appliedCoupon?.code || null,
      },
    });
  } catch (error) {
    console.log("RAZORPAY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create Razorpay order",
    });
  }
};

export const verifyRazorpayPayment = async (req, res) => {
  try {
    console.log("VERIFY RAZORPAY PAYMENT API HIT");

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      shippingAddress,
      couponCode,
    } = req.body;

    // --------------------------------
    // 1. Validate payment details
    // --------------------------------

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment details are required",
      });
    }

    // --------------------------------
    // 2. Validate shipping address
    // --------------------------------

    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: "Shipping address is required",
      });
    }

    // --------------------------------
    // 3. Verify Razorpay signature
    // --------------------------------

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", SECRET_KEY)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    console.log("PAYMENT SIGNATURE VERIFIED");

    // --------------------------------
    // 4. Check if order already exists
    // --------------------------------

    const existingOrder = await Order.findOne({
      razorpayOrderId: razorpay_order_id,
    });

    if (existingOrder) {
      return res.status(200).json({
        success: true,
        message: "Order already exists",
        data: existingOrder,
      });
    }

    // --------------------------------
    // 5. Get user's cart
    // --------------------------------

    const cart = await Cart.findOne({
      user: req.existsUser.user,
    });

    if (!cart) {
      return res.status(400).json({
        success: false,
        message: "Cart not found",
      });
    }

    if (!cart.items || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    // --------------------------------
    // 6. Calculate subtotal
    // --------------------------------

    let subtotal = 0;

    for (const cartItem of cart.items) {
      const product = await Product.findById(cartItem.productId);

      if (!product) {
        return res.status(400).json({
          success: false,
          message: "Product not found",
        });
      }

      if (product.isActive === false) {
        return res.status(400).json({
          success: false,
          message: `${product.name} is currently unavailable`,
        });
      }

      if (product.stock < cartItem.quantity) {
        return res.status(400).json({
          success: false,
          message: `Product stock is not available for ${product.name}`,
        });
      }

      const itemTotal = Number(product.salePrice) * Number(cartItem.quantity);

      subtotal += itemTotal;
    }

    // --------------------------------
    // 7. Validate coupon again
    // --------------------------------

    let discountAmount = 0;
    let appliedCoupon = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.trim().toUpperCase(),
      });

      if (!coupon) {
        return res.status(400).json({
          success: false,
          message: "Coupon not found",
        });
      }

      // Check active
      if (!coupon.isActive) {
        return res.status(400).json({
          success: false,
          message: "Coupon is not active",
        });
      }

      // Check start date
      const currentDate = new Date();

      if (currentDate < coupon.startDate) {
        return res.status(400).json({
          success: false,
          message: "Coupon is not active yet",
        });
      }

      // Check expiry
      if (currentDate > coupon.expiryDate) {
        return res.status(400).json({
          success: false,
          message: "Coupon has expired",
        });
      }

      // Check minimum order amount
      if (subtotal < coupon.minimumOrderAmount) {
        return res.status(400).json({
          success: false,
          message: `Minimum order amount should be ₹${coupon.minimumOrderAmount}`,
        });
      }

      // Check usage limit
      if (
        coupon.usageLimit !== undefined &&
        coupon.usedCount >= coupon.usageLimit
      ) {
        return res.status(400).json({
          success: false,
          message: "Coupon usage limit has been reached",
        });
      }

      // --------------------------------
      // Calculate coupon discount
      // --------------------------------

      if (coupon.discountType === "PERCENTAGE") {
        discountAmount = (subtotal * coupon.discountValue) / 100;

        if (
          coupon.maximumDiscount !== undefined &&
          discountAmount > coupon.maximumDiscount
        ) {
          discountAmount = coupon.maximumDiscount;
        }
      }

      if (coupon.discountType === "FIXED") {
        discountAmount = coupon.discountValue;

        if (discountAmount > subtotal) {
          discountAmount = subtotal;
        }
      }

      appliedCoupon = coupon;
    }

    // --------------------------------
    // 8. Calculate shipping
    // --------------------------------

    const shippingCharges = subtotal >= 1000 ? 0 : 100;

    // --------------------------------
    // 9. Calculate final amount
    // --------------------------------

    const totalAmount = subtotal - discountAmount + shippingCharges;

    console.log("SUBTOTAL:", subtotal);
    console.log("COUPON:", appliedCoupon?.code || null);
    console.log("DISCOUNT:", discountAmount);
    console.log("SHIPPING:", shippingCharges);
    console.log("FINAL AMOUNT:", totalAmount);

    // --------------------------------
    // 10. Create order
    // --------------------------------

    const newOrder = await Order.create({
      user: req.existsUser.user,

      items: cart.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
      })),

      shippingAddress,

      paymentMethod: "ONLINE",

      paymentStatus: "PAID",

      orderStatus: "CONFIRM",

      shippingCharges,

      couponCode: appliedCoupon?.code || undefined,

      couponDiscount: discountAmount,

      totalAmount,

      razorpayOrderId: razorpay_order_id,

      razorpayPaymentId: razorpay_payment_id,
    });

    // --------------------------------
    // 11. Increase coupon used count
    // --------------------------------

    if (appliedCoupon) {
      await Coupon.findByIdAndUpdate(appliedCoupon._id, {
        $inc: {
          usedCount: 1,
        },
      });
    }

    // --------------------------------
    // 12. Reduce product stock
    // --------------------------------

    for (const cartItem of cart.items) {
      await Product.findByIdAndUpdate(cartItem.productId, {
        $inc: {
          stock: -cartItem.quantity,
        },
      });
    }

    // --------------------------------
    // 13. Clear cart
    // --------------------------------

    cart.items = [];

    await cart.save();

    console.log("ONLINE ORDER CREATED:", newOrder._id);

    // --------------------------------
    // 14. Send response
    // --------------------------------

    return res.status(200).json({
      success: true,
      message: "Payment verified and order placed successfully",
      data: newOrder,
    });
  } catch (error) {
    console.log("VERIFY PAYMENT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Payment verification failed",
    });
  }
};
