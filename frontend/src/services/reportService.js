import api from "./api";

// GET /reports/inventory
export const getInventoryReport = () => api.get("/reports/inventory");

// GET /reports/borrowing
export const getUsageReport = () => api.get("/reports/borrowing");

// GET /reports/popular
export const getPopularBooksReport = () => api.get("/reports/popular");

// GET /reports/overdue-trends
export const getOverdueTrendsReport = () => api.get("/reports/overdue-trends");

// GET /overdue/distribution - Raw data for Box Plots (List of days overdue)
// Even though the URL is different, it serves the report, so keep it here.
export const getOverdueDistribution = () => api.get("/overdue/distribution");

// GET /reports/:type/export
export const exportReport = (type, params) =>
  api.get(`/reports/${type}/export`, { params, responseType: "blob" });
