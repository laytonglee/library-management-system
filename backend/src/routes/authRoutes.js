const express = require("express");
const router = express.Router();
const {
  register,
  login,
  logout,
  getMe,
} = require("../controllers/authController");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/authMiddleware");

// ── Public routes ────────────────────────────────────────────────────────────
// POST /api/auth/register  — self-registration (student/teacher only)
router.post("/register", register);
// POST /api/auth/login
router.post("/login", login);

// ── Authenticated routes ─────────────────────────────────────────────────────
// POST /api/auth/logout
router.post("/logout", authenticateToken, logout);
// GET /api/auth/me
router.get("/me", authenticateToken, getMe);

// ── Admin-only routes ────────────────────────────────────────────────────────
// POST /api/auth/register/admin — create user with any role (admin only)
router.post(
  "/register/admin",
  authenticateToken,
  authorizeRoles("admin"),
  register,
);

module.exports = router;
