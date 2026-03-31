import api from "./api";

// POST /transactions/checkout
export const checkoutBook = (data) => api.post("/transactions/checkout", data);

// POST /transactions/return
export const returnBook = (data) => api.post("/transactions/return", data);

// GET /transactions — list all transactions
export const getTransactions = (params) => api.get("/transactions", { params });

// GET /transactions/:id — single transaction
export const getTransactionById = (id) => api.get(`/transactions/${id}`);

// GET /transactions/user/:userId — borrowing history
export const getUserTransactions = (userId) =>
  api.get(`/transactions/user/${userId}`);

// GET /transactions/active — currently borrowed
export const getActiveTransactions = () => api.get("/transactions/active");

// ─── Overdue ──────────────────────────────────────────────────────────────────

// GET /overdue
export const getOverdue = (params) => api.get("/overdue", { params });

// GET /overdue/summary
export const getOverdueSummary = () => api.get("/overdue/summary");

// POST /overdue/run-check
export const runOverdueCheck = () => api.post("/overdue/run-check");
