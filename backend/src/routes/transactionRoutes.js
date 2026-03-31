// backend/src/routes/transactionRoutes.js
const express = require("express");
const router = express.Router();
const { checkout, returnBookHandler } = require("../controllers/transactionController");
const { authenticateToken, requirePermission } = require("../middleware/authMiddleware");

// POST /api/v1/transactions/checkout — librarian or admin only
router.post(
  "/checkout",
  authenticateToken,
  requirePermission("checkout_book"),
  checkout,
);

// POST /api/v1/transactions/return — librarian or admin only
router.post(
  "/return",
  authenticateToken,
  requirePermission("return_book"),
  returnBookHandler,
);

module.exports = router;
