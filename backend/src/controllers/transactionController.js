// backend/src/controllers/transactionController.js
const { checkoutBook, returnBook } = require("../services/checkoutService");

/**
 * POST /api/transactions/checkout
 * Body: { borrowerId, bookCopyId, notes? }
 * librarianId is taken from the authenticated user (req.user.userId)
 */
async function checkout(req, res) {
  const { borrowerId, bookCopyId, notes } = req.body;

  if (!borrowerId || !bookCopyId) {
    return res.status(400).json({
      success: false,
      message: "borrowerId and bookCopyId are required",
    });
  }

  try {
    const result = await checkoutBook({
      borrowerId,
      librarianId: req.user.userId,
      bookCopyId,
      notes,
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: "Book checked out successfully",
      data: result,
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Internal server error",
    });
  }
}

/**
 * POST /api/transactions/return
 * Body: { bookCopyId, notes? }
 */
async function returnBookHandler(req, res) {
  const { bookCopyId, notes } = req.body;

  if (!bookCopyId) {
    return res.status(400).json({
      success: false,
      message: "bookCopyId is required",
    });
  }

  try {
    const result = await returnBook({
      bookCopyId,
      notes,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: "Book returned successfully",
      data: result,
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Internal server error",
    });
  }
}

module.exports = { checkout, returnBookHandler };
