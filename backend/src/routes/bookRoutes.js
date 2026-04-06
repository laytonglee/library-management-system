// backend/src/routes/transactionRoutes.js
const express = require("express");
const router = express.Router();
const { getBookById } = require("../controllers/bookController");
const {
  authenticateToken,
  requirePermission,
} = require("../middleware/authMiddleware");

router.get("/:id", authenticateToken, getBookById);

module.exports = router;
