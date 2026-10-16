const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  viaWorkspaceParam,
  viaBodyWorkspace,
  viaListId,
} = require("../middleware/workspaceAccess");
const {
  createList,
  getListsByWorkspace,
  reorderLists,
  updateList,
  deleteList,
} = require("../controllers/listController");

router.post("/", protect, viaBodyWorkspace, createList);
router.get("/workspace/:workspaceId", protect, viaWorkspaceParam, getListsByWorkspace);
router.put("/reorder", protect, reorderLists);
router.put("/:id", protect, viaListId, updateList);
router.delete("/:id", protect, viaListId, deleteList);

module.exports = router;
