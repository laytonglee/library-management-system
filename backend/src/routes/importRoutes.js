// backend/src/routes/importRoutes.js
const express = require("express");
const { authenticateToken, authorizeRoles } = require("../middleware/authMiddleware");
const { upload, importBooksHandler, exportBooksHandler } = require("../controllers/importController");

const router = express.Router();

router.use(authenticateToken, authorizeRoles("admin"));

router.get("/export/books", exportBooksHandler);
router.post("/books", upload.single("file"), importBooksHandler);

module.exports = router;
