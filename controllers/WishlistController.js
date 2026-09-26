import { useParams } from "react-router-dom";
import Wishlists from "../models/WishlistModel.js";

export const createWishlist = async (req, res) => {
  try {
    const { item } = req.body;

    const userId = req.existsUser.user;

    if (!item) {
      return res
        .status(400)
        .json({ success: false, message: "Item is required" });
    }

    let wishlist = await Wishlists.findOne({ user: userId });

    if (!wishlist) {
      const wishlist = await Wishlists.create({
        user: userId,
        item: [item],
      });

      res.status(201).json({
        success: true,
        message: "Product added to wishlist successfully....",
        data: wishlist,
      });
    }

    const existsItem = wishlist.item.some((existItem) => {
      return existItem.productId.toString() == item.productId;
    });

    if (existsItem) {
      return res
        .status(404)
        .json({ success: false, message: "Item already exists" });
    }

    wishlist.item.push(item);

    await wishlist.save();

    res.status(201).json({
      success: true,
      message: "Item added successfully",
      data: wishlist,
    });
  } catch (error) {
    console.log("WISHLIST_DATA:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getAllWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlists.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Data Fetch Successfully",
      count: wishlist.length,
      data: wishlist,
    });
  } catch (error) {
    console.log("WISHLIST_ERROR:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const updateWishlist = async (req, res) => {
  try {
    const { id } = req.params();

    const wishlist = await Wishlists.findByIdAndUpdate(id, { new: true });

    if (wishlist) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });
    }

    res.status(201).json({
      success: true,
      message: "Item found successfully",
      data: wishlist,
    });
  } catch (error) {
    console.log("WISHLIST_ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
