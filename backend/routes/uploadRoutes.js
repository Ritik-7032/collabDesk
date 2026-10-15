const express = require("express");
const router = express.Router();
const multer = require("multer");
const { protect } = require("../middleware/authMiddleware");
const {
  generatePresignedUrl,
  uploadDirect,
} = require("../controllers/uploadController");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Production zero-RAM S3 presigned URL
router.post("/presign", protect, generatePresignedUrl);

// Fallback multipart upload
router.post("/", protect, upload.single("file"), uploadDirect);

module.exports = router;