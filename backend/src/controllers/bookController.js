const {
  listBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
  listCopies,
  addBookCopy,
  updateBookCopy,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../services/bookService");

/**
 * GET /api/v1/books
 */
async function list(req, res) {
  try {
    const result = await listBooks(req.query);
    return res.json({
      success: true,
      data: result.books,
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

/**
 * GET /api/v1/books/:id
 */
async function getOne(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid book ID" });
    const book = await getBook(id);
    return res.json({ success: true, data: book });
  } catch (err) {
    return res
      .status(err.statusCode || 500)
      .json({
        success: false,
        message: err.message || "Internal server error",
      });
  }
}

/**
 * POST /api/v1/books
 */
async function create(req, res) {
  try {
    const result = await createBook({
      ...req.body,
      actorId: req.user.userId,
      ipAddress: req.ip,
    });
    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    return res
      .status(err.statusCode || 500)
      .json({
        success: false,
        message: err.message || "Internal server error",
      });
  }
}

/**
 * PUT /api/v1/books/:id
 */
async function update(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid book ID" });
    const book = await updateBook(id, req.body);
    return res.json({ success: true, data: book });
  } catch (err) {
    return res
      .status(err.statusCode || 500)
      .json({
        success: false,
        message: err.message || "Internal server error",
      });
  }
}

/**
 * DELETE /api/v1/books/:id
 */
async function remove(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid book ID" });
    await deleteBook(id);
    return res.json({ success: true, message: "Book deleted" });
  } catch (err) {
    return res
      .status(err.statusCode || 500)
      .json({
        success: false,
        message: err.message || "Internal server error",
      });
  }
}

/**
 * GET /api/v1/books/:id/copies
 */
async function getCopies(req, res) {
  try {
    const bookId = parseInt(req.params.id, 10);
    if (isNaN(bookId))
      return res
        .status(400)
        .json({ success: false, message: "Invalid book ID" });
    const copies = await listCopies(bookId);
    return res.json({ success: true, data: copies });
  } catch (err) {
    return res
      .status(err.statusCode || 500)
      .json({
        success: false,
        message: err.message || "Internal server error",
      });
  }
}

/**
 * POST /api/v1/books/:id/copies
 */
async function createCopy(req, res) {
  try {
    const bookId = parseInt(req.params.id, 10);
    if (isNaN(bookId))
      return res
        .status(400)
        .json({ success: false, message: "Invalid book ID" });
    const result = await addBookCopy(bookId, {
      ...req.body,
      actorId: req.user.userId,
      ipAddress: req.ip,
    });
    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    return res
      .status(err.statusCode || 500)
      .json({
        success: false,
        message: err.message || "Internal server error",
      });
  }
}

/**
 * PUT /api/v1/books/:id/copies/:copyId
 */
async function updateCopyHandler(req, res) {
  try {
    const bookId = parseInt(req.params.id, 10);
    const copyId = parseInt(req.params.copyId, 10);
    if (isNaN(bookId) || isNaN(copyId))
      return res.status(400).json({ success: false, message: "Invalid ID" });
    const result = await updateBookCopy(bookId, copyId, req.body, {
      actorId: req.user.userId,
      ipAddress: req.ip,
    });
    return res.json({ success: true, data: result });
  } catch (err) {
    return res
      .status(err.statusCode || 500)
      .json({
        success: false,
        message: err.message || "Internal server error",
      });
  }
}

// ─── Categories ───────────────────────────────────────────────────────────────

async function getCategories(req, res) {
  try {
    const categories = await listCategories();
    return res.json({ success: true, data: categories });
  } catch (err) {
    return res
      .status(500)
      .json({
        success: false,
        message: err.message || "Internal server error",
      });
  }
}

async function addCategory(req, res) {
  try {
    const category = await createCategory(req.body);
    return res.status(201).json({ success: true, data: category });
  } catch (err) {
    return res
      .status(err.statusCode || (err.code === "P2002" ? 409 : 500))
      .json({
        success: false,
        message: err.message || "Internal server error",
      });
  }
}

async function editCategory(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid category ID" });
    const category = await updateCategory(id, req.body);
    return res.json({ success: true, data: category });
  } catch (err) {
    return res
      .status(err.statusCode || 500)
      .json({
        success: false,
        message: err.message || "Internal server error",
      });
  }
}

async function removeCategory(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid category ID" });
    await deleteCategory(id);
    return res.json({ success: true, message: "Category deleted" });
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
  list,
  getOne,
  create,
  update,
  remove,
  getCopies,
  createCopy,
  updateCopyHandler,
  getCategories,
  addCategory,
  editCategory,
  removeCategory,
};
