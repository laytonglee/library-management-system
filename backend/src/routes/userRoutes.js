const express = require("express");
const router = express.Router();
const {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deactivateUser,
  deleteUser,
  borrowingHistory,
} = require("../controllers/userController");
const {
  authenticateToken,
  requirePermission,
} = require("../middleware/authMiddleware");

// All user management routes require auth + manage_users permission
router.use(authenticateToken);
router.use(requirePermission("manage_users"));

// GET /api/v1/users
router.get("/", listUsers);

// POST /api/v1/users
router.post("/", createUser);

// GET /api/v1/users/:id
router.get("/:id", getUser);

// PUT /api/v1/users/:id
router.put("/:id", updateUser);

// PUT /api/v1/users/:id/deactivate
router.put("/:id/deactivate", deactivateUser);

// DELETE /api/v1/users/:id
router.delete("/:id", deleteUser);

// GET /api/v1/users/:id/borrowing-history
router.get("/:id/borrowing-history", borrowingHistory);

module.exports = router;
