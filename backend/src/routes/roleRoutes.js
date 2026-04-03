const express = require("express");
const router = express.Router();
const { listRoles } = require("../controllers/userController");
const { authenticateToken } = require("../middleware/authMiddleware");

// GET /api/v1/roles
router.get("/", authenticateToken, listRoles);

module.exports = router;
