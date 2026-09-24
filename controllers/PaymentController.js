import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import razorpay from "../config/razorpay.js";

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
