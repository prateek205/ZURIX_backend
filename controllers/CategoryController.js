import Category from "../models/CategoryModel.js";

export const createCategory = async (req, res) => {
  try {
    const { name, image, gender } = req.body;

    if (!name || !image) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are mandatory" });
    }

    const existCategory = await Category.findOne({ name });
    if (existCategory) {
      return res
        .status(409)
        .json({ success: false, message: "Category Already Exists" });
    }

    const newCategory = new Category({ name, image, gender });

    await newCategory.save();

    res.status(201).json({
      success: true,
      message: "All category fetch successfully",
      newCategory,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getAllCategory = async (req, res) => {
  try {
    const { search, sort, filter } = req.query;

    const query = {};

    if (search) {
      query.name = {
        $regex: search,
        $options: "i",
      };
    }

    if (filter) {
      query.gender = filter;
    }

    const sortOptions = sort || "-createdAt";

    const data = await Category.find(query).sort(sortOptions);
    res.status(200).json({
      success: true,
      message: "Fetch Data Successfully",
      count: data.length,
      data,
    });
  } catch (error) {
    console.log("CATEGORY:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Category.findById(id);
    if (!data) {
      return res
        .status(400)
        .json({ success: false, message: "Category not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Data Fetch Successfully", data });
  } catch (error) {
    console.log("CATEGORY_ID:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const updateCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Category.findByIdAndUpdate(id, req.body, { new: true });

    res
      .status(201)
      .json({ success: true, message: "Category Update successfully", data });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const deleteCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Category.findByIdAndDelete(id);

    if (!data) {
      return res
        .status(400)
        .json({ success: false, message: "Item not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Category Deleted Successfully", data });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
