const express = require("express");
const router = express.Router();
const { listAuditLogs } = require("../controllers/auditLogController");
const {
  authenticateToken,
  requirePermission,
} = require("../middleware/authMiddleware");

// GET /api/v1/audit-logs — admin and librarian only
router.get(
  "/",
  authenticateToken,
  requirePermission("view_audit_logs"),
  listAuditLogs,
);

module.exports = router;
