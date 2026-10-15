const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { generateSubtasks } = require("../controllers/aiController");

router.post("/generate-subtasks", protect, generateSubtasks);

module.exports = router;