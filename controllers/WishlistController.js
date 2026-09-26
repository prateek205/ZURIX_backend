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

    const wishList = await Wishlists.findOne({ user: userId });

    if (!wishList) {
      wishList = await Wishlists.create({
        user: userId,
        item: [item],
      });
    }

    const existsItem = wishlist.item.some((exitsItem) => {
      return existsItem.productId.toString() == item.productId;
    });

    if (existsItem) {
      return res
        .status(404)
        .json({ success: false, message: "Item already exists" });
    }

    wishList.item.push(item);

    await wishList.save();

    res.status(201).json({
      success: true,
      message: "Item added successfully",
      data: wishList,
    });
  } catch (error) {
    console.log("WISHLIST_DATA:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
