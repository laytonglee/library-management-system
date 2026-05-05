const auditLogService = require("../services/auditLogService");

async function listAuditLogs(req, res) {
  try {
    const result = await auditLogService.listAuditLogs(req.query);
    return res.json({
      success: true,
      data: result.logs,
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

module.exports = { listAuditLogs };
