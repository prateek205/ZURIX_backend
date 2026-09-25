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

    // 1. Find user's cart
    const cart = await Cart.findOne({
      user: req.existsUser.user,
    });

    if (!cart) {
      return res.status(400).json({
        success: false,
        message: "Cart not found",
      });
    }

    // 2. Check cart items
    if (!cart.items || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    // 3. Calculate subtotal
    let subtotal = 0;

    for (const cartItem of cart.items) {
      const product = await Product.findById(cartItem.productId);

      // Product validation
      if (!product) {
        return res.status(400).json({
          success: false,
          message: "Product not found",
        });
      }

      // Check product active
      if (product.isActive === false) {
        return res.status(400).json({
          success: false,
          message: `${product.name} is currently unavailable`,
        });
      }

      // Check stock
      if (product.stock < cartItem.quantity) {
        return res.status(400).json({
          success: false,
          message: `Product stock is not available for ${product.name}`,
        });
      }

      // Calculate item price
      const itemTotal = Number(product.salePrice) * Number(cartItem.quantity);

      subtotal += itemTotal;
    }

    // 4. Calculate shipping
    const shippingCharges = subtotal >= 1000 ? 0 : 100;

    // 5. Calculate final amount
    const totalAmount = subtotal + shippingCharges;

    console.log("SUBTOTAL:", subtotal);
    console.log("SHIPPING:", shippingCharges);
    console.log("TOTAL:", totalAmount);

    // 6. Convert INR to paise
    const razorpayAmount = Math.round(totalAmount * 100);

    // 7. Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: razorpayAmount,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: req.existsUser.user.toString(),
      },
    });

    console.log("RAZORPAY ORDER:", razorpayOrder);

    // 8. Send response to frontend
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

    // 1. Validate payment details
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment details are required",
      });
    }

    // 2. Validate shipping address
    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: "Shipping address is required",
      });
    }

    // 3. Create signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    // 4. Compare signatures
    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    console.log("PAYMENT SIGNATURE VERIFIED");

    // 5. Get user's cart
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

    // 6. Calculate order total from backend
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

    // 7. Create MongoDB order
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

    // 8. Reduce stock
    for (const cartItem of cart.items) {
      await Product.findByIdAndUpdate(cartItem.productId, {
        $inc: {
          stock: -cartItem.quantity,
        },
      });
    }

    // 9. Clear cart
    cart.items = [];
    await cart.save();

    console.log("ONLINE ORDER CREATED:", newOrder._id);

    // 10. Send response
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
