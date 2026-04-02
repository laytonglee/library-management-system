const express = require("express");
const router = express.Router();
const {
  getCategories,
  addCategory,
  editCategory,
  removeCategory,
} = require("../controllers/bookController");
const {
  authenticateToken,
  requirePermission,
} = require("../middleware/authMiddleware");

// GET /api/v1/categories
router.get("/", authenticateToken, getCategories);
router.post(
  "/",
  authenticateToken,
  requirePermission("manage_catalog"),
  addCategory,
);
router.put(
  "/:id",
  authenticateToken,
  requirePermission("manage_catalog"),
  editCategory,
);
router.delete(
  "/:id",
  authenticateToken,
  requirePermission("manage_catalog"),
  removeCategory,
);

module.exports = router;
