const express = require("express");
const router = express.Router();
const {
  listOverdue,
  overdueSummary,
  runOverdueCheck,
} = require("../controllers/overdueController");
const {
  authenticateToken,
  requirePermission,
} = require("../middleware/authMiddleware");

// GET /api/v1/overdue — list overdue transactions
router.get(
  "/",
  authenticateToken,
  requirePermission("view_overdue"),
  listOverdue,
);

// GET /api/v1/overdue/summary — overdue statistics
router.get(
  "/summary",
  authenticateToken,
  requirePermission("view_overdue"),
  overdueSummary,
);

// POST /api/v1/overdue/run-check — trigger overdue detection
router.post(
  "/run-check",
  authenticateToken,
  requirePermission("view_overdue"),
  runOverdueCheck,
);

module.exports = router;
