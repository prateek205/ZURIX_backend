import Category from "../models/CategoryModel.js";

// ===============
// CREATE CATEGORY
// ===============

export const createCategory = async (req, res) => {
  try {
    // call the feild from category model.
    const { name, image, gender } = req.body;

    // validates the feild based on requirement.
    if (!name || !image) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are mandatory" });
    }

    // check wheather the category is exists or not based one of its feild.
    const existCategory = await Category.findOne({ name });
    if (existCategory) {
      return res
        .status(409)
        .json({ success: false, message: "Category Already Exists" });
    }

    // after the validation create the new category.
    const newCategory = new Category({ name, image, gender });

    // save to mongodb.
    await newCategory.save();

    // give the response to client side.
    res.status(201).json({
      success: true,
      message: "All category fetch successfully",
      newCategory,
    });
  } catch (error) {
    // check the error.
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// ================
// GET ALL CATEGORY
// ================
export const getAllCategory = async (req, res) => {
  try {
    // implement the query params for get all category.
    const { search, sort, filter } = req.query;

    const query = {};

    // search params.
    if (search) {
      query.name = {
        $regex: search,
        $options: "i",
      };
    }

    // filter params.
    if (filter) {
      query.gender = filter;
    }

    const sortOptions = sort || "-createdAt";

    // fetch the data .
    const data = await Category.find(query).sort(sortOptions);
    res.status(200).json({
      success: true,
      message: "Fetch Data Successfully",
      count: data.length,
      data,
    });
  } catch (error) {
    // check the error.
    console.log("CATEGORY:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// ===================
// GET CATEGORY BY ID
// ===================
export const getCategoryById = async (req, res) => {
  try {
    // call the category id when we create the new category.
    const { id } = req.params;

    // after that find the category by id.
    const data = await Category.findById(id);

    // validate the category it is currently available or not.
    if (!data) {
      return res
        .status(400)
        .json({ success: false, message: "Category not found" });
    }

    // after chaecking all validation then send the response to frontend side.
    res
      .status(200)
      .json({ success: true, message: "Data Fetch Successfully", data });
  } catch (error) {
    // check if any error occur while finding the category by id.
    console.log("CATEGORY_ID:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const updateCategoryById = async (req, res) => {
  try {
    // call the id after creating the new category.
    const { id } = req.params;

    // after that find then update it.
    const data = await Category.findByIdAndUpdate(id, req.body, { new: true });

    // after updating then send the response.
    res
      .status(201)
      .json({ success: true, message: "Category Update successfully", data });
  } catch (error) {
    // check the error if occur.
    console.log("UPDATE_CATEGORY:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const deleteCategoryById = async (req, res) => {
  try {
    // call the id after creating the new category.
    const { id } = req.params;

    // based on this id find the data and delete it.
    const data = await Category.findByIdAndDelete(id);

    // validate wheather the data is present or not.
    if (!data) {
      return res
        .status(400)
        .json({ success: false, message: "Item not found" });
    }

    // after validation send the response the frontend side.
    res
      .status(200)
      .json({ success: true, message: "Category Deleted Successfully", data });
  } catch (error) {
    // check the error occur.
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
