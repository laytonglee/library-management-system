import api from "./api";

// GET /audit-logs
export const getAuditLogs = (params) => api.get("/audit-logs", { params });
