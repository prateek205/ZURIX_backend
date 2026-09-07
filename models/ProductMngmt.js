import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  salePrice: {
    type: Number,
    required:true,
    min: 0,
  },
  size: [
    {
      type: String,
    },
  ],
  colors: [
    {
      type: String,
    },
  ],
  stock: {
    type: Number,
    default: 10,
    min: 10,
  },
  isFeatured: {
    type: Boolean,
    default:false
  },
  isActive:{
    type:Boolean,
    default:false
  }
},{
    timestamps:true
});

const Product = mongoose.model("Product", ProductSchema)

export default Product;
