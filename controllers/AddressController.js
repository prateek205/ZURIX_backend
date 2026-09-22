import Address from "../models/AddressModel.js";

export const createAddress = async (req, res) => {
  try {
    const { fullName, mobileNumber, address, city, state, country, pincode } =
      req.body;

    if (
      !fullName ||
      !mobileNumber ||
      !address ||
      !city ||
      !state ||
      !country ||
      !pincode
    ) {
      return res
        .status(400)
        .json({ success: false, message: "All feilds are mandatory" });
    }

    const newAddress = await Address.create({
      user: req.existsUser.user,
      fullName,
      mobileNumber,
      address,
      city,
      state,
      country,
      pincode,
    });

    res.status(201).json({
      success: true,
      message: "Address Save Successfully",
      data: newAddress,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getAllAddress = async (req, res) => {
  try {

    console.log("USER:",req.existsUser)

    const address = await Address.find({
      user: req.existsUser.user,
    }).sort({ createdAt: -1 });

    if (data) {
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });
    }

    res.status(200).json({
      success: true,
      message: "Address fetch successfully",
      data: address,
      count: address.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
