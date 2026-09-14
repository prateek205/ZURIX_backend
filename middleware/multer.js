import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../utils/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, res) => ({
    folder: `{product_images/${req.body.category}/${req.body.product}}`,

    allowed_format: ["jpg", "png", "jpeg", "webp"],

    public_id: `${Date.now()}-${file.originalName}.split(".")[0].replace(/\s+/g,"-")}`,
  }),
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "images/jpg",
    "images/jpeg",
    "images/png",
    "images/webp",
  ];

  if (allowedTypes.includes(file.mimitype)) {
    cb(null, true);
  } else {
    cb("only image file are allowed", false);
  }
};

const upload = multer({
  storage,
  fileFilter,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export default upload;
