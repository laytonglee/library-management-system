// backend/src/controllers/transactionController.js
const { checkoutBook, returnBook } = require("../services/checkoutService");
const transactionService = require("../services/transactionService");

async function checkout(req, res) {
  try {
    const { borrowerId, bookCopyId, notes } = req.body;
    if (!borrowerId) {
      return res.status(400).json({ success: false, message: "borrowerId is required" });
    }
    if (!bookCopyId) {
      return res.status(400).json({ success: false, message: "bookCopyId is required" });
    }
    const result = await checkoutBook({
      borrowerId,
      librarianId: req.user.userId,
      bookCopyId,
      notes,
      ipAddress: req.ip,
    });
    return res
      .status(201)
      .json({
        success: true,
        message: "Book checked out successfully",
        data: result,
      });
  } catch (err) {
    return res
      .status(err.statusCode || 500)
      .json({
        success: false,
        message: err.message || "Internal server error",
      });
  }
}

async function returnBookHandler(req, res) {
  try {
    const { bookCopyId, notes } = req.body;
    if (!bookCopyId) {
      return res.status(400).json({ success: false, message: "bookCopyId is required" });
    }
    const result = await returnBook({
      bookCopyId,
      librarianId: req.user.userId,
      notes,
      ipAddress: req.ip,
    });
    return res.json({
      success: true,
      message: "Book returned successfully",
      data: result,
    });
  } catch (err) {
    return res
      .status(err.statusCode || 500)
      .json({
        success: false,
        message: err.message || "Internal server error",
      });
  }
}

async function listTransactions(req, res) {
  try {
    const result = await transactionService.listTransactions(req.query);
    return res.json({
      success: true,
      data: result.transactions,
      pagination: result.pagination,
    });
  } catch (err) {
    return res
      .status(err.statusCode || 500)
      .json({
        success: false,
        message: err.message || "Internal server error",
      });
  }
}

async function getTransaction(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid transaction ID" });
    const transaction = await transactionService.getTransactionById(id);
    return res.json({ success: true, data: transaction });
  } catch (err) {
    return res
      .status(err.statusCode || 500)
      .json({
        success: false,
        message: err.message || "Internal server error",
      });
  }
}

async function getActiveTransactions(req, res) {
  try {
    const transactions = await transactionService.getActiveTransactions();
    return res.json({ success: true, data: transactions });
  } catch (err) {
    return res
      .status(err.statusCode || 500)
      .json({
        success: false,
        message: err.message || "Internal server error",
      });
  }
}

async function getUserTransactions(req, res) {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId))
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID" });

    if (
      req.user.userId !== userId &&
      req.user.role !== "librarian" &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({
          success: false,
          message: "You can only view your own history",
        });
    }

    const result = await transactionService.getUserTransactions(
      userId,
      req.query,
    );
    return res.json({
      success: true,
      data: result.transactions,
      pagination: result.pagination,
    });
  } catch (err) {
    return res
      .status(err.statusCode || 500)
      .json({
        success: false,
        message: err.message || "Internal server error",
      });
  }
}

module.exports = {
  checkout,
  returnBookHandler,
  listTransactions,
  getTransaction,
  getActiveTransactions,
  getUserTransactions,
};
