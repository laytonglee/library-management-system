const express = require("express");
const router = express.Router();
const {
  listBorrowingPolicies,
  updateBorrowingPolicy,
} = require("../controllers/userController");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/authMiddleware");

// GET /api/v1/borrowing-policies
router.get("/", authenticateToken, listBorrowingPolicies);

// PUT /api/v1/borrowing-policies/:roleId — librarian and admin can edit
router.put(
  "/:roleId",
  authenticateToken,
  authorizeRoles("librarian", "admin"),
  updateBorrowingPolicy,
);

module.exports = router;
