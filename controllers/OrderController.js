import Cart from "../models/CartModel.js";
import Order from "../models/OrderModel.js";
import Product from "../models/ProductMngmt.js";

// =================
// CREATE ORDER
// =================

export const createOrder = async (req, res) => {
  try {
    // bring the value from order model body.
    const { shippingAddress, paymentMethod } = req.body;

    // validates all the feilds for shipping address.
    if (
      !shippingAddress.fullName ||
      !shippingAddress.mobileNumber ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.pinCode
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Complete feilds are required" });
    }

    // check the user cart
    const cart = await Cart.findOne({
      Auth: req.Auth._id,
    });

    if (!cart) {
      return res
        .status(400)
        .json({ success: false, message: "Cart not found" });
    }

    // validates the cart items
    if (!cart.item || cart.item.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    // create the order item

    const orderItems = [];

    let subtotal = 0;

    for (const cartItem of cart.items) {
      //   find the product in the cart item.
      const product = await Product.findById(cartItem.product);

      // validate the product is not there in cartItem
      if (!product) {
        return res.status(400).json({
          success: false,
          message: "Product not exists in cart",
        });
      }

      //   validate the product is active or not
      if (product.isActive === false) {
        return res.status(400).json({
          success: false,
          message: `${product.name} is currently unavailable`,
        });
      }

      //   validate the product is below the stock.
      if (product.stock < cartItem.quantity) {
        return res.status(400).json({
          success: false,
          message: `Product stock is not available for ${product.name}`,
        });
      }

      //   calculate the item.
      const totalItem = product.price * cartItem.quantity;

      subtotal += totalItem;

      //   take the product information.
      orderItems.push({
        product: product._id,
        quantity: cartItem.quantity,
        price: product.price,
        size: cartItem.size,
        color: cartItem.color,
      });
    }

    // give the shipping charges as per the subtotal amount.
    const shippingCharges = subtotal > 1000 ? 0 : 100;

    // calculate the final amount with subtotal and shipping charges.
    const finalAmount = subtotal + shippingCharges;

    // atlast then create the order with all information.
    const order = await Order.createOrder({
      user: req.Auth._id,
      items: cartItem,
      shippingAddress,
      paymentMethod,
      paymentStatus: paymentMethod === "COD" ? "PENDING" : "PENDING",
      orderStatus: "PENDING",
      subtotal,
      shippingCharges,
      finalAmount,
    });

    // now after order creation then reduce the quantity of that product.
    for (const cartItem of cart.items) {
      await Product.findByIdAndUpdate(cartItem.product, {
        $inc: {
          stock: -cartItem.quantity,
        },
      });
    }

    // clear the cart.
    cart.item = [];

    // save to mongodb.
    await cart.save();

    // send the response.
    res.status(201).json({
      success: true,
      message: "Order create successfully",
      data: order,
    });
  } catch (error) {
    // check the error if occur
    console.log("ORDER_STATUS:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// ==============
// GET ALL ORDERS
// ==============

export const getAllOrder = async (req, res) => {
  try {
    // find the user's order
    const order = await Order.find({
      user: req.user._id,
    })
      .populate("items.prdoduct")
      .sort("-createdAt");

    // send the response the for fetching the order
    res.status(200).json({
      success: true,
      message: "Fetch all Orders successfully",
      count: order.length,
      data: order,
    });
  } catch (error) {
    // check the error if data is not coming.
    console.log("ALL_ORDER_DATA:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// ================
// GET ORDER BY ID
// ================

export const getOrderById = async (req, res) => {
  try {
    // get the id from all orders
    const { id } = req.params;

    // find the order based on it's orderId, userId
    const order = await Order.findById({
      _id: id,
      user: req.user._id,
    }).populate("items.product");

    // validates if the order is not found
    if (!order) {
      res.status(400).json({ success: false, message: "Order not found" });
    }

    // after validating then send the response the client side.
    res
      .status(200)
      .json({ success: true, message: "Order fetch successfuly", data: order });
  } catch (error) {
    // check the order by id is not getting.
    console.log("ORDER_BY_ID:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// ================
// CANCEL THE ORDER
// ================

export const cancelOrder = async (req, res) => {
  try {
    // call the id from order that we have created.
    const { id } = req.params;

    // find the order based on the order id and user id which have order it.
    const order = await Order.findOne({
      _id: id,
      user: req.user._id,
    });

    // validate the order wheather it having or not.
    if (!order) {
      return res
        .status(400)
        .json({ success: false, message: "order not found" });
    }

    // validate the order status if the user want to cancel the order.
    if (
      order.orderStatus === "DELIVERED" ||
      order.orderStatus === "CANCELLED"
    ) {
      return res.status(404).json({
        success: false,
        message: `order cannot be cancelled because it already ${order.orderStatus}`,
      });
    }

    // if the order cancelled then restore the product back into the quantity.
    for (const item of order.item) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }

    // now the order status should cancel
    ((order.orderStatus = "CANCELLED"),
      // save to mongodb
      await order.save());

    // send the response
    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      data: order,
    });
  } catch (error) {
    // check the error for order cancel.
    console.log("ORDER_CAN:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
