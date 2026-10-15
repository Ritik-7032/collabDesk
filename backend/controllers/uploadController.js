const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const s3 = require("../config/s3");

// Production direct-to-S3 Presigned URL generation (Zero server RAM consumption)
const generatePresignedUrl = async (req, res) => {
  try {
    const { fileName, fileType } = req.body;
    if (!fileName || !fileType) {
      return res.status(400).json({ message: "fileName and fileType are required" });
    }

    const sanitized = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `uploads/${Date.now()}-${sanitized}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
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

    const fileName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await s3.send(command);

    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

    res.status(201).json({
      message: "File uploaded successfully",
      url: fileUrl,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  generatePresignedUrl,
  uploadDirect,
};
