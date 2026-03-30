import multer from "multer";
import path from "path";

const storage = multer.memoryStorage();
const allowedExt = [".jpg", ".jpeg", ".png"];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname);
  if (!allowedExt.includes(ext)) {
    return cb(new Error("input file can only be in format (.jpg, .jpeg, .png)"));
  }
  cb(null, true);
};

const upload = multer({ storage, fileFilter });

export default upload;
