const express = require("express");
const router = express.Router();
const {
  list,
  getOne,
  create,
  update,
  remove,
  getCopies,
  createCopy,
  updateCopyHandler,
  getCategories,
  addCategory: createCategory,
  editCategory: updateCategory,
  removeCategory: deleteCategory,
} = require("../controllers/bookController");
const {
  authenticateToken,
  requirePermission,
} = require("../middleware/authMiddleware");

// ── Public (authenticated) book routes ───────────────────────────────────────
router.get("/", authenticateToken, list);
router.get("/categories", authenticateToken, getCategories);
router.get("/:id", authenticateToken, getOne);
router.get("/:id/copies", authenticateToken, getCopies);

// ── Catalog management (librarian/admin) ─────────────────────────────────────
router.post(
  "/",
  authenticateToken,
  requirePermission("manage_catalog"),
  create,
);
router.put(
  "/:id",
  authenticateToken,
  requirePermission("manage_catalog"),
  update,
);
router.delete(
  "/:id",
  authenticateToken,
  requirePermission("manage_catalog"),
  remove,
);
router.post(
  "/:id/copies",
  authenticateToken,
  requirePermission("manage_catalog"),
  createCopy,
);
router.put(
  "/:id/copies/:copyId",
  authenticateToken,
  requirePermission("manage_catalog"),
  updateCopyHandler,
);

// ── Category management ──────────────────────────────────────────────────────
router.post(
  "/categories",
  authenticateToken,
  requirePermission("manage_catalog"),
  createCategory,
);
router.put(
  "/categories/:id",
  authenticateToken,
  requirePermission("manage_catalog"),
  updateCategory,
);
router.delete(
  "/categories/:id",
  authenticateToken,
  requirePermission("manage_catalog"),
  deleteCategory,
);

module.exports = router;
