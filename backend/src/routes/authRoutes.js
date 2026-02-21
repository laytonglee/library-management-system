const express = require("express");
const router = express.Router();
const {
  register,
  login,
  logout,
  getMe,
} = require("../controllers/authController");
const { authenticateToken } = require("../middleware/authMiddleware");

// POST /api/auth/register
router.post("/register", register);
// POST /api/auth/login
router.post("/login", login);
// POST /api/auth/logout
router.post("/logout", logout);
// GET /api/auth/me
router.get("/me", authenticateToken, getMe);
// GET /api/auth/test
router.get("/test", authenticateToken, (req, res) => {
  res.json({ message: "Auth route is working!" });
});

module.exports = router;
