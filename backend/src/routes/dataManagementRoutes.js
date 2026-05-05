const express = require("express");
const router = express.Router();
const { exportData, importData, backupDatabase } = require("../controllers/dataManagementController");
const { authenticateToken, authorizeRoles } = require("../middleware/authMiddleware");

// All routes require admin role
router.use(authenticateToken, authorizeRoles("admin"));

// GET  /api/v1/data-management/export  — export all data as JSON
router.get("/export", exportData);

// POST /api/v1/data-management/import  — import books/categories from JSON body
router.post("/import", importData);

// GET  /api/v1/data-management/backup  — download SQL backup via pg_dump
router.get("/backup", backupDatabase);

module.exports = router;
