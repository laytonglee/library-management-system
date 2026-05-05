const express = require("express");
const router = express.Router();
const {
  getInventory,
  getBorrowing,
  getPopular,
  getOverdueTrends,
  exportReport,
} = require("../controllers/reportController");
const {
  authenticateToken,
  requirePermission,
} = require("../middleware/authMiddleware");

router.use(authenticateToken);
router.use(requirePermission("view_reports"));

router.get("/inventory", getInventory);
router.get("/borrowing", getBorrowing);
router.get("/popular", getPopular);
router.get("/overdue-trends", getOverdueTrends);
router.get("/:type/export", exportReport);

module.exports = router;
