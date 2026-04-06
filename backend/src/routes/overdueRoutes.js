const express = require("express");
const router = express.Router();
const {
  listOverdue,
  overdueSummary,
  runOverdueCheck,
  overdueDistribution,
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

// 2. GET /api/v1/overdue/distribution — raw data for Box Plots
router.get(
  "/distribution",
  authenticateToken,
  requirePermission("view_overdue"),
  overdueDistribution,
);

// POST /api/v1/overdue/run-check — trigger overdue detection
router.post(
  "/run-check",
  authenticateToken,
  requirePermission("view_overdue"),
  runOverdueCheck,
);

module.exports = router;
