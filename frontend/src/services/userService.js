import api from "./api";

// ─── Users ────────────────────────────────────────────────────────────────────

// GET /users — list all users
export const getUsers = (params) => api.get("/users", { params });

// GET /users/:id — get user profile
export const getUserById = (id) => api.get(`/users/${id}`);

// POST /users — create user account
export const createUser = (data) => api.post("/users", data);

// PUT /users/:id — update user info/role
export const updateUser = (id, data) => api.put(`/users/${id}`, data);

// PUT /users/:id/deactivate — deactivate user
export const deactivateUser = (id) => api.put(`/users/${id}/deactivate`);

// DELETE /users/:id — delete user
export const deleteUser = (id) => api.delete(`/users/${id}`);

// ─── Roles ────────────────────────────────────────────────────────────────────

// GET /roles
export const getRoles = () => api.get("/roles");

// ─── Borrowing Policies ──────────────────────────────────────────────────────

// GET /borrowing-policies
export const getBorrowingPolicies = () => api.get("/borrowing-policies");

// PUT /borrowing-policies/:roleId
export const updateBorrowingPolicy = (roleId, data) =>
  api.put(`/borrowing-policies/${roleId}`, data);
