import multer from "multer";

export const screenshotUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (!file.mimetype?.startsWith("image/")) {
      cb(new Error("Screenshot must be an image file"));
      return;
    }
    cb(null, true);
  },
});
