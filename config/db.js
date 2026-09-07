import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const MONGO_URI = process.env.MONGO_URI;

export const connectdb = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("🚀 MongoDB is connected successfully!!!");
  } catch (error) {
    console.log("❌ Mongodb connection is failed...");
  }
};
