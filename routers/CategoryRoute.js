import express from "express";
import {
  createCategory,
  deleteCategoryById,
  getAllCategory,
  getCategoryById,
  updateCategoryById,
} from "../controllers/CategoryController.js";

const router = express.Router();

router.post("/createCategory", createCategory);
router.get("/getAllCategory", getAllCategory);
router.get("/getCategoryById/:id", getCategoryById);
router.put("/updateCategoryById/:id", updateCategoryById)
router.delete("/deleteCategoryById/:id", deleteCategoryById)

export default router;
