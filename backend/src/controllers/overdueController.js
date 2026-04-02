const overdueService = require("../services/overdueService");

async function listOverdue(req, res) {
  try {
    const result = await overdueService.listOverdue(req.query);
    return res.json({
      success: true,
      data: result.data,
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

async function overdueSummary(req, res) {
  try {
    const data = await overdueService.getOverdueSummary();
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

async function runOverdueCheck(req, res) {
  try {
    const result = await overdueService.runOverdueCheck();
    return res.json({
      success: true,
      message: `Overdue check complete. ${result.overdueCount} overdue items found, ${result.newNotifications} new notifications sent.`,
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

module.exports = { listOverdue, overdueSummary, runOverdueCheck };
