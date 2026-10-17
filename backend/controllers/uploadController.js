const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const s3 = require("../config/s3");

const ALLOWED_MIME_TYPES = new Set([
  // Images (SVG omitted to prevent stored script injection / XSS)
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  // Documents
  "application/pdf",
  "text/plain",
  "text/csv",
  "text/markdown",
  "application/json",
  "application/zip",
  "application/x-zip-compressed",
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Production direct-to-S3 Presigned URL generation (Zero server RAM consumption)
const generatePresignedUrl = async (req, res) => {
  try {
    const { fileName, fileType, fileSize } = req.body;
    if (!fileName || !fileType || !fileSize) {
      return res.status(400).json({ message: "fileName, fileType, and fileSize are required" });
    }

    const normalizedMime = fileType.toLowerCase().trim();
    if (!ALLOWED_MIME_TYPES.has(normalizedMime)) {
      return res.status(400).json({
        message: "Unsupported file type. Allowed: images, PDFs, text, zip, json",
      });
    }

    // Maximum 10MB file limit with mandatory integer validation
    const parsedSize = Number(fileSize);
    if (!Number.isInteger(parsedSize) || parsedSize <= 0 || parsedSize > MAX_FILE_SIZE) {
      return res.status(400).json({
        message: "Invalid fileSize: must be an integer between 1 byte and 10MB",
      });
    }

    const sanitized = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const userPrefix = req.user?._id ? String(req.user._id) : "common";
    const key = `uploads/${userPrefix}/${Date.now()}-${sanitized}`;

    const putParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      ContentType: normalizedMime,
    };

    if (fileSize) {
      putParams.ContentLength = Number(fileSize);
    }

    const command = new PutObjectCommand(putParams);
    const uploadUrl = await getSignedUrl(s3, command, {
      expiresIn: 300,
      signableHeaders: new Set(["content-type"]),
    });
    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    res.json({ uploadUrl, fileUrl, key });
  } catch (error) {
    console.error("Presign error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Fallback direct server upload
const uploadDirect = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const normalizedMime = file.mimetype.toLowerCase().trim();
    if (!ALLOWED_MIME_TYPES.has(normalizedMime)) {
      return res.status(400).json({
        message: "Unsupported file type. Allowed: images, PDFs, text, zip, json",
      });
    }

    if (file.size > MAX_FILE_SIZE) {
      return res.status(400).json({ message: "File exceeds 10MB size limit" });
    }

    const userPrefix = req.user?._id ? String(req.user._id) : "common";
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `uploads/${userPrefix}/${Date.now()}-${sanitized}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: normalizedMime,
      ContentLength: file.size,
    });

    await s3.send(command);

    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    res.status(201).json({
      message: "File uploaded successfully",
      url: fileUrl,
      key,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  generatePresignedUrl,
  uploadDirect,
};
