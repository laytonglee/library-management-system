const dashboardService = require("../services/dashboardService");

async function getStats(req, res) {
  try {
    const data = await dashboardService.getDashboardStats();
    return res.json({ success: true, data });
  } catch (err) {
    return res
      .status(err.statusCode || 500)
      .json({
        success: false,
        message: err.message || "Internal server error",
      });
  }
}

module.exports = { getStats };
