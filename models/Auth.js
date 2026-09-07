import mongoose from "mongoose";

const AuthSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      minLength: [8, "Password must be atleast 8 characters"],
      unique: true,
    },
  },
  {
    timestamps: true,
  },
);

const Auths = mongoose.model("Auths", AuthSchema);
export default Auths;
