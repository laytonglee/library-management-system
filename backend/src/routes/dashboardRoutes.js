const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");
const { getStats } = require("../controllers/dashboardController");

router.use(authenticateToken);

router.get("/stats", getStats);

module.exports = router;
