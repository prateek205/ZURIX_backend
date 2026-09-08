import Cart from "../models/CartModel.js";
import Product from "../models/ProductMngmt.js";

// ================================
// GET CART Based on USER LOGGED-IN
// ================================

export const getAllCart = async (req, res) => {
  try {
    // find wheather the user logged-in and show the list of item which add to his cart.
    const cart = await Cart.findOne({
      auth: req.auth._id,
    }).populate("items.product");

    // validates the data wheather cart it is empty or not.
    if (!cart) {
      return res.status(200).json({
        success: true,
        message: "Cart is Empty",
        cart: {
          items: [],
        },
      });
    }

    // give the response after adding the item to cart.
    res.status(200).json({
      success: true,
      message: "Items Fetch Successfully",
      count: cart.length,
      data: cart,
    });
  } catch (error) {
    // show the error while adding item to cart.
    console.log("CART_DATA", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// =========================================
// ADD TO CART the ITEM after user logged-in
// =========================================

export const addToCart = async (req, res) => {
  try {
    // bring the data from cart model.
    const { product, quantity, size, color } = req.body;

    // find the product based on the productId
    const products = await Product.findById(productId);

    // validate the product is available or not.
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    // validate the product is active or not.
    if (product.isActive === false) {
      return res
        .status(404)
        .json({ success: false, message: "Product is not available" });
    }

    // validates the product should be not below the default quantity.
    if (!quantity || quantity < 1) {
      return res
        .status(404)
        .json({ success: false, message: "Product must be atleast 1 qty" });
    }

    // validate the product is in the stock or not.
    if (product.stock < quantity) {
      return res
        .status(404)
        .json({ success: false, message: "Product is out of stock" });
    }

    // find out the user is logged-in.
    let cart = await Cart.findOne({
      auth: req.auth._id,
    });

    // validate the cart is empty or not wheather it empty then create the new cart.
    if (!cart) {
      cart = new Cart({
        auth: req.auth._id,
        items: [
          {
            product: productId,
            quantity,
            size,
            color,
          },
        ],
      });
    }

    //   Check the product according to it's Varient.

    const existItem = cart.item.find(
      (item) => item.product.toString() === productId,
      item.size === size,
      item.color === color,
    );

    if (existItem) {
      return (newQty = existItem.quantity + quantity);

      if (newQty > product.stock) {
        return res.status(404).json({
          success: false,
          message: "Item has been exceeded over the stock",
        });
      }
      existItem.quantity = newQty;
    } else {
      cart.item.push({
        product: productId,
        quantity,
        size,
        color,
      });
    }

    // save the item to mongodb.
    await cart.save();

    // send response of item added to cart.
    res.status(201).json({
      success: true,
      message: "Item added to cart successfully",
      data: cart,
    });
  } catch (error) {
    // show the error the if item not added to cart.
    console.log("ADD_TO_CART", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// ==================================================
// UPDATE THE CART QUANTITY AFTER ADDING ITEM TO CART
// ==================================================

export const updateCartItem = async (req, res) => {
  try {
    // bring the itemId from the cart where the item is added.
    const { itemId } = req.params;
    // bring the quantity from the body where the itemSchema is there.
    const { quantity } = req.body;

    // validates the quantity which should not be less the default quantity.
    if (!quantity || quantity < 1) {
      return res
        .status(400)
        .json({ success: false, message: "Item must be atleast 1" });
    }

    // find the user wheather it have added item to cart.
    const cart = await Cart.findOne({
      auth: req.auth._id,
    });

    // validates wheather cart found or not.
    if (!cart) {
      return res
        .status(400)
        .json({ success: false, message: "Cart not found" });
    }

    // find the item based on it's itemId.
    const item = cart.item.id(itemId);

    // validates the item is correct or not.
    if (!item) {
      return res
        .status(400)
        .json({ success: false, message: "Item not found" });
    }

    // find the product based on it's productId
    const product = await Product.findById(productId);

    // validates wheather the product is correct or not.
    if (!product) {
      return res
        .status(400)
        .json({ success: false, message: "Product not found" });
    }

    // validates the quantity should not be exceed over the product stock.
    if (quantity > product.stock) {
      return res
        .status(400)
        .json({ success: false, message: "Product is exceed over the stock" });
    }

    // after validating all query the item quantity should update.
    item.quantity = quantity;

    // the save the update item to mongodb.
    await cart.save();

    // send the response after the quantity is updated.
    res.status(200).json({
      success: true,
      message: "Item has been updated successfully",
      data: cart,
    });
  } catch (error) {
    // check if the error occur while updating the cart.
    console.log("CART_UPDATE:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// =========================
// REMOVE THE ITEM FROM CART
// =========================

export const removeCartItem = async (req, res) => {
  try {
    // bring the item from it's cart.
    const { itemId } = req.params;

    // find the cart of user.
    const cart = await Cart.findOne({
      auth: req.auth._id,
    });

    // validates the cart of user is not
    if (!cart) {
      return res
        .status(400)
        .json({ success: false, message: "Cart not found" });
    }

    // find the item in cart.
    const item = cart.items.id(itemId);

    // validate the item in cart or not.
    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });
    }

    // after validating all query delete the item from cart.
    item.deleteOne();

    // save to mongo db
    await item.save();

    // send the response.
    res
      .status(200)
      .json({ success: true, message: "Item remove successfully", data: cart });
  } catch (error) {
    // check the error if occur.
    console.log("REMOVE_CART:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// ==============
// CLEAR THE CART
// ==============

export const clearCart = async (req, res) => {
  try {
    // find the cart of user.
    const cart = await Cart.findOne({
      auth: req.auth.id,
    });

    // validate the cart is of user or not.
    if (!cart) {
      return res
        .status(400)
        .json({ success: false, message: "Cart not found" });
    }

    // after validating the cart then clear it.
    cart.items = [];

    // save to mongodb.
    await cart.save();

    // send the response.
    res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
      data: cart,
    });
  } catch (error) {
    // check the error occur while clear the cart.
    console.log("CLEAR_CART:", error);
    res.status(500).json({ sucess: false, message: "Internal Server Error" });
  }
};
