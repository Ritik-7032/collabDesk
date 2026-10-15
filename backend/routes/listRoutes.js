const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createList,
  getListsByWorkspace,
  reorderLists,
  updateList,
  deleteList,
} = require("../controllers/listController");

router.post("/", protect, createList);
router.get("/workspace/:workspaceId", protect, getListsByWorkspace);
router.put("/reorder", protect, reorderLists);
router.put("/:id", protect, updateList);
router.delete("/:id", protect, deleteList);

module.exports = router;
