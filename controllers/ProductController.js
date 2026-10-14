import { useParams } from "react-router-dom";
import Product from "../models/ProductMngmt.js";
import Category from "../models/CategoryModel.js";

const parseArrayField = (value, fieldName) => {
  if (Array.isArray(value)) return value;

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${fieldName} must be an array`);
  }

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      throw new Error(`${fieldName} must be an array`);
    }
    return parsed;
  } catch {
    throw new Error(`${fieldName} must be a valid JSON array`);
  }
};

const normalizeVariants = (value) => {
  const variants = parseArrayField(value, "variants");
  const seen = new Set();

  if (variants.length === 0) {
    throw new Error("At least one color-size variant is required");
  }

  return variants.map((variant) => {
    const color = String(variant?.color || "").trim();
    const size = String(variant?.size || "").trim();
    const stock = Number(variant?.stock);

    if (!color || !size) {
      throw new Error("Every variant must have a color and size");
    }

    if (
      variant?.stock === "" ||
      variant?.stock == null ||
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      throw new Error(`Invalid stock for ${color} / ${size}`);
    }

    const key = `${color.toLowerCase()}::${size.toLowerCase()}`;

    if (seen.has(key)) {
      throw new Error(`Duplicate variant: ${color} / ${size}`);
    }

    seen.add(key);

    return { color, size, stock };
  });
};

const getTotalStock = (variants) =>
  variants.reduce((total, variant) => total + variant.stock, 0);

// ==================================
// CREATE PRODUCT BUSINESS LOGIC
// ==================================

export const CreateProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      price,
      salePrice,
      isFeatured,
      isActive,
    } = req.body;

    if (
      !name?.trim() ||
      !description?.trim() ||
      !category ||
      req.body.price == null ||
      req.body.salePrice == null ||
      req.body.variants == null
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, description, category, prices, and variants are required",
      });
    }

    const parsedPrice = Number(price);
    const parsedSalePrice = Number(salePrice);

    if (
      !Number.isFinite(parsedPrice) ||
      !Number.isFinite(parsedSalePrice) ||
      parsedPrice < 0 ||
      parsedSalePrice < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Prices must be valid non-negative numbers",
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one image is required",
      });
    }

    const normalizedName = name.trim();

    const productExists = await Product.findOne({
      name: {
        $regex: `^${normalizedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i",
      },
    });

    if (productExists) {
      return res.status(409).json({
        success: false,
        message: "Product already exists",
      });
    }

    const variants = normalizeVariants(req.body.variants);
    const totalStock = getTotalStock(variants);

    // Derive available colors and sizes from the submitted variants.
    const colors = [...new Set(variants.map((variant) => variant.color))];
    const size = [...new Set(variants.map((variant) => variant.size))];

    const images = req.files.map((file) => ({
      url: file.path,
      publicId: file.filename,
    }));

    const newProduct = await Product.create({
      name: normalizedName,
      description: description.trim(),
      category,
      price: parsedPrice,
      salePrice: parsedSalePrice,
      size,
      colors,
      variants,
      stock: totalStock,
      images,
      isFeatured: isFeatured === true || isFeatured === "true",
      isActive: isActive !== false && isActive !== "false",
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: newProduct,
    });
  } catch (error) {
    console.error("CREATE PRODUCT ERROR:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to create product",
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

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const updates = { ...req.body };

    // Parse and validate variants whenever they are supplied.
    if (updates.variants !== undefined) {
      const variants = normalizeVariants(updates.variants);

      updates.variants = variants;
      updates.colors = [...new Set(variants.map((variant) => variant.color))];
      updates.size = [...new Set(variants.map((variant) => variant.size))];
      updates.stock = getTotalStock(variants);
    } else if (updates.colors !== undefined || updates.size !== undefined) {
      return res.status(400).json({
        success: false,
        message: "Submit variants when changing product colors or sizes",
      });
    }

    // Never accept a manually edited total stock without variants.
    if (updates.stock !== undefined && updates.variants === undefined) {
      return res.status(400).json({
        success: false,
        message: "Stock must be updated through product variants",
      });
    }

    if (updates.price !== undefined) {
      updates.price = Number(updates.price);
    }

    if (updates.salePrice !== undefined) {
      updates.salePrice = Number(updates.salePrice);
    }

    if (
      (updates.price !== undefined &&
        (!Number.isFinite(updates.price) || updates.price < 0)) ||
      (updates.salePrice !== undefined &&
        (!Number.isFinite(updates.salePrice) || updates.salePrice < 0))
    ) {
      return res.status(400).json({
        success: false,
        message: "Prices must be valid non-negative numbers",
      });
    }

    // Do not allow arbitrary fields to be updated through req.body.
    const allowedFields = [
      "name",
      "description",
      "category",
      "price",
      "salePrice",
      "colors",
      "size",
      "variants",
      "stock",
      "isFeatured",
      "isActive",
    ];

    const safeUpdates = {};

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        safeUpdates[field] = updates[field];
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: safeUpdates },
      {
        new: true,
        runValidators: true,
      },
    ).populate("category");

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    console.error("UPDATE_PRODUCT_ERROR:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to update product",
    });
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
