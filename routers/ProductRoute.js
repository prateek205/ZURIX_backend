import express from "express";
import {
  CreateProduct,
  deleteProductById,
  getAllProducts,
  getProductById,
  updateProductById,
} from "../controllers/ProductController.js";
import upload from "../middleware/multer.js";

const router = express.Router();

router.post("/addProducts", upload.array("images", 5), CreateProduct);
router.get("/getAllProducts", getAllProducts);
router.get("/getProductById/:id", getProductById);
router.put("/updateProductById/:id", updateProductById);
router.delete("/deleteProductById/:id", deleteProductById);

export default router;
