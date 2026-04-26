const reportService = require("../services/reportService");

function handleError(res, err) {
  return res
    .status(err.statusCode || 500)
    .json({ success: false, message: err.message || "Internal server error" });
}

async function getInventory(req, res) {
  try {
    const data = await reportService.getInventoryReport();
    return res.json({ success: true, data });
  } catch (err) {
    return handleError(res, err);
  }
}

async function getBorrowing(req, res) {
  try {
    const data = await reportService.getBorrowingReport(req.query);
    return res.json({ success: true, data });
  } catch (err) {
    return handleError(res, err);
  }
}

async function getPopular(req, res) {
  try {
    const books = await reportService.getPopularBooksReport(req.query);
    return res.json({ success: true, data: { books } });
  } catch (err) {
    return handleError(res, err);
  }
}

async function getOverdueTrends(req, res) {
  try {
    const data = await reportService.getOverdueTrendsReport();
    return res.json({ success: true, data });
  } catch (err) {
    return handleError(res, err);
  }
}

const EXPORT_CONFIG = {
  inventory: {
    filename: "inventory-report.csv",
    async getRows() {
      const data = await reportService.getInventoryReport();
      return [
        { metric: "totalBooks", value: data.totalBooks },
        { metric: "totalCopies", value: data.totalCopies },
        ...Object.entries(data.statusBreakdown).map(([k, v]) => ({
          metric: k,
          value: v,
        })),
      ];
    },
  },
  borrowing: {
    filename: "borrowing-report.csv",
    async getRows(query) {
      const data = await reportService.getBorrowingReport(query);
      return [
        { section: "summary", key: "totalCheckouts", value: data.totalCheckouts },
        ...Object.entries(data.byMonth).map(([k, v]) => ({
          section: "byMonth",
          key: k,
          value: v,
        })),
        ...Object.entries(data.byCategory).map(([k, v]) => ({
          section: "byCategory",
          key: k,
          value: v,
        })),
      ];
    },
  },
  popular: {
    filename: "popular-books-report.csv",
    async getRows(query) {
      const books = await reportService.getPopularBooksReport(query);
      return books.map((item) => ({
        title: item.book.title,
        author: item.book.author,
        category: item.book.category.name,
        borrowCount: item.borrowCount,
      }));
    },
  },
  "overdue-trends": {
    filename: "overdue-trends-report.csv",
    async getRows() {
      const data = await reportService.getOverdueTrendsReport();
      return data.trends;
    },
  },
};

async function exportReport(req, res) {
  const config = EXPORT_CONFIG[req.params.type];
  if (!config) {
    return res
      .status(400)
      .json({ success: false, message: "Unknown report type" });
  }
  try {
    const rows = await config.getRows(req.query);
    const csv = reportService.toCsv(rows);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${config.filename}"`,
    );
    return res.send(csv);
  } catch (err) {
    return handleError(res, err);
  }
}

module.exports = {
  getInventory,
  getBorrowing,
  getPopular,
  getOverdueTrends,
  exportReport,
};
