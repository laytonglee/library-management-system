import api from "./api";

// GET /reports/inventory
export const getInventoryReport = () => api.get("/reports/inventory");

// GET /reports/usage
export const getUsageReport = () => api.get("/reports/usage");

// GET /reports/popular-books
export const getPopularBooksReport = () => api.get("/reports/popular-books");

// GET /reports/overdue-trends
export const getOverdueTrendsReport = () => api.get("/reports/overdue-trends");

// GET /overdue/distribution - Raw data for Box Plots (List of days overdue)
// Even though the URL is different, it serves the report, so keep it here.
export const getOverdueDistribution = () => api.get("/overdue/distribution");

// GET /reports/export
export const exportReport = (params) =>
  api.get("/reports/export", { params, responseType: "blob" });
