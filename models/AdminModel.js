import mongoose, { mongo } from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      min: [8, "password must be aleast 8 characters"],
    },
    role: {
      type: String,
      enum: ["ADMIN"],
      default: "ADMIN",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

const Admin = mongoose.model("Admin", adminSchema);

export default Admin;
