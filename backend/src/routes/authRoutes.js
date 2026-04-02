const express = require("express");
const router = express.Router();
const {
  register,
  login,
  logout,
  getMe,
  refresh,
} = require("../controllers/authController");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/authMiddleware");

// ── Public routes ────────────────────────────────────────────────────────────
// POST /api/v1/auth/register  — self-registration (student/teacher only)
router.post("/register", register);
// POST /api/v1/auth/login
router.post("/login", login);
// POST /api/v1/auth/refresh
router.post("/refresh", refresh);

// ── Authenticated routes ─────────────────────────────────────────────────────
// POST /api/v1/auth/logout
router.post("/logout", authenticateToken, logout);
// GET /api/v1/auth/me
router.get("/me", authenticateToken, getMe);

// ── Admin-only routes ────────────────────────────────────────────────────────
// POST /api/v1/auth/register/admin — create user with any role (admin only)
router.post(
  "/register/admin",
  authenticateToken,
  authorizeRoles("admin"),
  register,
);

module.exports = router;
