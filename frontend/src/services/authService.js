import api from "./api";

// POST /auth/register
export const register = (data) => api.post("/auth/register", data);

// POST /auth/login
export const login = (credentials) => api.post("/auth/login", credentials);

// POST /auth/logout
export const logout = () => api.post("/auth/logout");

// GET /auth/me
export const getMe = () => api.get("/auth/me");
