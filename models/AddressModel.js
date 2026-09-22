import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
    },

    fullName: {
      type: String,
      required: true,
    },

    mobileNumber: {
      type: String,
      trim: true,
      required: true,
    },
    address: {
      type: String,
      trim: true,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      default:"India",
      required: true,
    },
    pincode: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const Addresses = mongoose.model("Addresses", addressSchema);

export const Addresses;
