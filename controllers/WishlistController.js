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

    if (!wishlist) {
      wishlist = await Wishlists.create({
        user: userId,
        item: [item],
      });
    }

    res.status(201).json({
      success: true,
      message: "Item Added to wishlist",
      data: wishlist,
    });

    const existsItem = wishlist.item.some((exitsItem) => {
      existItem.productId.toString() == item.productId;
    });

    if (existItem) {
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
