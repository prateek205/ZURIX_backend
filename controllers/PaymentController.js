import Cart from "../models/CartModel.js";
import Product from "../models/ProductMngmt.js";
import razorpay from "../config/razorpay.js";
import Order from "../models/OrderModel.js";
import crypto from "crypto";

const SECRET_KEY = process.env.RAZORPAY_KEY_SECRET;

export const createRazorpayOrder = async (req, res) => {
  try {
    console.log("RAZORPAY CREATE ORDER API HIT");

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

    const shippingCharges = subtotal >= 1000 ? 0 : 100;

    const totalAmount = subtotal + shippingCharges;

    console.log("SUBTOTAL:", subtotal);
    console.log("SHIPPING:", shippingCharges);
    console.log("TOTAL:", totalAmount);

    const razorpayAmount = Math.round(totalAmount * 100);

    const razorpayOrder = await razorpay.orders.create({
      amount: razorpayAmount,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: req.existsUser.user.toString(),
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
        totalAmount,
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
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment details are required",
      });
    }

    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: "Shipping address is required",
      });
    }

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

      subtotal += Number(product.salePrice) * Number(cartItem.quantity);
    }

    const shippingCharges = subtotal >= 1000 ? 0 : 100;

    const totalAmount = subtotal + shippingCharges;

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

      totalAmount,

      razorpayOrderId: razorpay_order_id,

      razorpayPaymentId: razorpay_payment_id,
    });

    for (const cartItem of cart.items) {
      await Product.findByIdAndUpdate(cartItem.productId, {
        $inc: {
          stock: -cartItem.quantity,
        },
      });
    }

    cart.items = [];
    await cart.save();

    console.log("ONLINE ORDER CREATED:", newOrder._id);

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
