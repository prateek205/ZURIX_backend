import { useParams } from "react-router-dom";
import Product from "../models/ProductMngmt.js";
import Category from "../models/CategoryModel.js";

// ==================================
// CREATE PRODUCT BUSINESS LOGIC
// ==================================

export const CreateProduct = async (req, res) => {
  try {
    // Get product fields from request body
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

    // Validate required fields
    if (
      !name ||
      !description ||
      !category ||
      price == null ||
      salePrice == null ||
      size == null ||
      colors == null ||
      stock == null
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are mandatory",
      });
    }

    // Validate image upload
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one image is required",
      });
    }

    // Check whether the product already exists
    const productExists = await Product.findOne({ name });

    if (productExists) {
      return res.status(409).json({
        success: false,
        message: "Product already exists",
      });
    }

    // Prepare Cloudinary image details
    const images = req.files.map((file) => ({
      url: file.path,
      publicId: file.filename,
    }));

    // Prepare product data
    const productData = {
      name,
      description,
      category,
      price,
      salePrice,
      size,
      colors,
      stock,
      images,
      isFeatured: isFeatured ?? false,
      isActive: isActive ?? true,
    };

    // Create and save product
    const newProduct = await Product.create(productData);

    // Send success response
    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: newProduct,
    });
  } catch (error) {
    console.error("CREATE PRODUCT ERROR:", error);
    console.error("ERROR MESSAGE:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
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

    if (category) {
      query.category = category;
    }

    if (colors) {
      query.colors = colors;
    }

    if (size) {
      query.size = size;
    }

    // Price Filter
    if (minPrice || maxPrice) {
      query.price = {};

      if (minPrice !== undefined && minPrice !== "") {
        query.price.$gte = Number(minPrice);
      }

      if (maxPrice !== undefined && maxPrice !== "") {
        query.price.$lte = Number(maxPrice);
      }
    }

    // Sorting
    let sortOption = {};

    switch (sort) {
      case "newest":
        sortOption = { createdAt: -1 };
        break;

      case "minPrice":
        sortOption = { price: 1 };
        break;

      case "maxPrice":
        sortOption = { price: -1 };
        break;

      default:
        sortOption = { createdAt: -1 };
    }

    const data = await Product.find(query)
      .sort(sortOption)
      .populate("category");
    console.log("PRODUCT_DATA:", data);
    res.status(200).json({
      success: true,
      message: "Fetch All Product Successfully",
      count: data.length,
      data,
    });
  } catch (error) {
    console.log("GET_PRODUCTS_ERROR:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Product.findById(id).populate("category", "name");
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
