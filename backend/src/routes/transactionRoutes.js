// backend/src/routes/transactionRoutes.js
const express = require("express");
const router = express.Router();
const {
  checkout,
  returnBookHandler,
  listTransactions,
  getTransaction,
  getActiveTransactions,
  getUserTransactions,
} = require("../controllers/transactionController");
const {
  authenticateToken,
  requirePermission,
} = require("../middleware/authMiddleware");

// All transaction routes require authentication
router.use(authenticateToken);

// GET /api/v1/transactions — list all transactions (librarian/admin)
router.get("/", requirePermission("checkout_book"), listTransactions);

// GET /api/v1/transactions/active — currently borrowed (librarian/admin)
router.get(
  "/active",
  requirePermission("checkout_book"),
  getActiveTransactions,
);

// GET /api/v1/transactions/user/:userId — borrowing history (own or admin)
router.get("/user/:userId", getUserTransactions);

// POST /api/v1/transactions/checkout — librarian or admin only
router.post("/checkout", requirePermission("checkout_book"), checkout);

// POST /api/v1/transactions/return — librarian or admin only
router.post("/return", requirePermission("return_book"), returnBookHandler);

// GET /api/v1/transactions/:id — single transaction
router.get("/:id", getTransaction);

module.exports = router;
