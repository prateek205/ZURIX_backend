import express from "express"
import { CreateProduct, deleteProductById, getAllProducts, getProductById, updateProductById } from "../controllers/ProductController.js"

const router = express.Router()


router.post("/addProducts",CreateProduct)
router.get("/getAllProducts", getAllProducts)
router.get("/getProductById/:id", getProductById)
router.put("/updateProductById/:id", updateProductById)
router.delete("/deleteProductById/:id", deleteProductById)

export default router;