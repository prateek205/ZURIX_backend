import { useParams } from "react-router-dom";
import Product from "../models/ProductMngmt.js";

// ==================================
// CREATE PRODUCT BUSINESS LOGIC
// ==================================

export const CreateProduct = async (req, res) => {
  try {
    // ********** stored the feilds from body which is create in the models **********

    const {
      name,
      description,
      category,
      price,
      salePrice,
      size,
      colors,
      stock,
      isFeatured,
      isActive,
    } = req.body;

    // ********** Validation for required feilds **********

    if (
      !name ||
      !description ||
      !category ||
      price == null ||
      salePrice == null ||
      !size ||
      !colors ||
      stock == null
    ) {
      return res
        .status(400)
        .json({ success: false, message: "All feilds are mandatory..." });
    }

    // ********** Validation for product exists or not **********

    const productExists = await Product.findOne({ name });
    if (productExists) {
      return res
        .status(400)
        .json({ success: false, message: "Product Already Exists" });
    }

    // ********** stored all feilds in one variables **********

    const productData = {
      name,
      description,
      category,
      price,
      salePrice,
      size,
      colors,
      stock,
      isFeatured,
      isActive,
    };

    const newProduct = new Product(productData);

    // ********** save the product to Databased **********

    await newProduct.save();

    // ********** send response to cleint side **********

    res.status(201).json({
      success: true,
      message: "Product Create Successfully!!!",
      data: newProduct,
    });
  } catch (error) {
    // ********** check the error if above response is failed **********

    console.log("PRODUCT_DATA:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const { search, filter, category, maxPrice, minPrice, sort, colors, size } =
      req.query;

    const query = {};

    if (search) {
      query.name = {
        $regex: search,
        $options: "i",
      };
    }

    if(category){
      query.category = category
    }

    if (colors) {
      query.colors = colors;
    }

    if (size) {
      query.size = size;
    }

    if ((minPrice, maxPrice)) {
      query.price = {};

      if (minPrice) {
        query.price.$gte = Number(minPrice);
      }

      if (maxPrice) {
        query.price.$lte = Number(maxPrice);
      }
    }

    const sortOption = sort || "-createdAt";

    const data = await Product.find(query).sort(sortOption);
    res.status(200).json({
      success: true,
      message: "Fetch All Product Successfully",
      count: data.length,
      data,
    });
  } catch (error) {
    console.log("GET_PRODUCTS:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Product.findById(id);
    res
      .status(200)
      .json({ success: true, message: "Product fetch successfully", data });
  } catch (error) {
    console.log("GET_PRODUCT_ID:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const updateProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Product.findByIdAndUpdate(id, req.body, { new: true });

    if (!data) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res
      .status(201)
      .json({ success: true, message: "Product update successfully", data });
  } catch (error) {
    console.log("UPDATE_PRODUCT:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const deleteProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Product.findByIdAndDelete(id);
    res
      .status(200)
      .json({ success: true, message: "Product Deleted Successfully", data });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
