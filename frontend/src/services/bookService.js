import api from "./api";

// GET /books — search/list all books
export const searchBooks = (params) => api.get("/books", { params });

// GET /books/:id — single book details
export const getBookById = (id) => api.get(`/books/${id}`);

// POST /books — add new book
export const createBook = (data) => api.post("/books", data);

// PUT /books/:id — update book
export const updateBook = (id, data) => api.put(`/books/${id}`, data);

// DELETE /books/:id — remove book
export const deleteBook = (id) => api.delete(`/books/${id}`);

// GET /books/:id/copies — list physical copies
export const getBookCopies = (bookId) => api.get(`/books/${bookId}/copies`);

// POST /books/:id/copies — add a physical copy
export const addBookCopy = (bookId, data) =>
  api.post(`/books/${bookId}/copies`, data);

// PUT /books/:id/copies/:copyId — update copy
export const updateBookCopy = (bookId, copyId, data) =>
  api.put(`/books/${bookId}/copies/${copyId}`, data);

// ─── Categories ───────────────────────────────────────────────────────────────

// GET /categories
export const getCategories = () => api.get("/categories");

// POST /categories
export const createCategory = (data) => api.post("/categories", data);

// PUT /categories/:id
export const updateCategory = (id, data) => api.put(`/categories/${id}`, data);

// DELETE /categories/:id
export const deleteCategory = (id) => api.delete(`/categories/${id}`);
