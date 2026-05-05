// backend/src/controllers/importController.js
const multer = require("multer");
const { importBooks, exportBooks } = require("../services/importService");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      return cb(null, true);
    }
    cb(new Error("Only CSV files are accepted"));
  },
});

async function importBooksHandler(req, res) {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "CSV file is required" });
  }
  try {
    const result = await importBooks(req.file.buffer, req.user.userId);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Internal server error",
    });
  }
}

async function exportBooksHandler(req, res) {
  try {
    const csv = await exportBooks();
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="books-export.csv"');
    return res.send(csv);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
}

module.exports = { upload, importBooksHandler, exportBooksHandler };
