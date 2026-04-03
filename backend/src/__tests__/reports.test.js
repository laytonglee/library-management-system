const request = require("supertest");

jest.mock("jsonwebtoken");
jest.mock("../services/reportService", () => ({
  getInventoryReport: jest.fn(),
  getBorrowingReport: jest.fn(),
  getPopularBooksReport: jest.fn(),
  getOverdueTrendsReport: jest.fn(),
  toCsv: jest.fn(),
}));

const jwt = require("jsonwebtoken");
const reportService = require("../services/reportService");
const app = require("../app");

function fakeUser(role = "librarian", userId = 42) {
  return { userId, role, username: `${role}-user` };
}

beforeEach(() => {
  jest.clearAllMocks();
  jwt.verify.mockReturnValue(fakeUser());
  reportService.toCsv.mockReturnValue("header,value\nrow,1");
});

describe("Reports API", () => {
  it("returns the inventory report", async () => {
    reportService.getInventoryReport.mockResolvedValue({
      totalBooks: 20,
      totalCopies: 45,
      statusBreakdown: { AVAILABLE: 30, BORROWED: 15 },
    });

    const res = await request(app)
      .get("/api/v1/reports/inventory")
      .set("Cookie", "accessToken=fake");

    expect(res.status).toBe(200);
    expect(res.body.data.totalBooks).toBe(20);
  });

  it("returns the borrowing report and forwards filters", async () => {
    reportService.getBorrowingReport.mockResolvedValue({
      totalCheckouts: 12,
      byMonth: { "2026-03": 7 },
      byCategory: { Fiction: 5 },
    });

    const res = await request(app)
      .get("/api/v1/reports/borrowing?startDate=2026-03-01&endDate=2026-03-31")
      .set("Cookie", "accessToken=fake");

    expect(res.status).toBe(200);
    expect(res.body.data.totalCheckouts).toBe(12);
    expect(reportService.getBorrowingReport).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: "2026-03-01",
        endDate: "2026-03-31",
      }),
    );
  });

  it("returns the popular books report", async () => {
    reportService.getPopularBooksReport.mockResolvedValue([
      {
        book: { title: "Popular Book", author: "Author", category: { name: "Fiction" } },
        borrowCount: 8,
      },
    ]);

    const res = await request(app)
      .get("/api/v1/reports/popular?limit=5")
      .set("Cookie", "accessToken=fake");

    expect(res.status).toBe(200);
    expect(res.body.data.books[0].borrowCount).toBe(8);
    expect(reportService.getPopularBooksReport).toHaveBeenCalledWith(
      expect.objectContaining({ limit: "5" }),
    );
  });

  it("returns overdue trends", async () => {
    reportService.getOverdueTrendsReport.mockResolvedValue({
      trends: [{ month: "2026-03", overdueCount: 4, avgDaysOverdue: 2.5 }],
    });

    const res = await request(app)
      .get("/api/v1/reports/overdue-trends")
      .set("Cookie", "accessToken=fake");

    expect(res.status).toBe(200);
    expect(res.body.data.trends[0].month).toBe("2026-03");
  });

  it("exports the inventory report as CSV", async () => {
    reportService.getInventoryReport.mockResolvedValue({
      totalBooks: 2,
      totalCopies: 3,
      statusBreakdown: { AVAILABLE: 2, BORROWED: 1 },
    });

    const res = await request(app)
      .get("/api/v1/reports/inventory/export")
      .set("Cookie", "accessToken=fake");

    expect(res.status).toBe(200);
    expect(reportService.toCsv).toHaveBeenCalled();
    expect(res.headers["content-disposition"]).toContain("inventory-report.csv");
    expect(res.text).toBe("header,value\nrow,1");
  });

  it("exports the borrowing report as CSV", async () => {
    reportService.getBorrowingReport.mockResolvedValue({
      totalCheckouts: 5,
      byMonth: { "2026-03": 3 },
      byCategory: { History: 2 },
    });

    const res = await request(app)
      .get("/api/v1/reports/borrowing/export")
      .set("Cookie", "accessToken=fake");

    expect(res.status).toBe(200);
    expect(reportService.toCsv).toHaveBeenCalledWith([
      { section: "summary", key: "totalCheckouts", value: 5 },
      { section: "byMonth", key: "2026-03", value: 3 },
      { section: "byCategory", key: "History", value: 2 },
    ]);
    expect(res.headers["content-disposition"]).toContain("borrowing-report.csv");
  });

  it("exports the popular books report as CSV", async () => {
    reportService.getPopularBooksReport.mockResolvedValue([
      {
        book: { title: "Popular Book", author: "Author", category: { name: "Fiction" } },
        borrowCount: 9,
      },
    ]);

    const res = await request(app)
      .get("/api/v1/reports/popular/export")
      .set("Cookie", "accessToken=fake");

    expect(res.status).toBe(200);
    expect(reportService.toCsv).toHaveBeenCalledWith([
      {
        title: "Popular Book",
        author: "Author",
        category: "Fiction",
        borrowCount: 9,
      },
    ]);
    expect(res.headers["content-disposition"]).toContain("popular-books-report.csv");
  });

  it("exports overdue trends as CSV", async () => {
    reportService.getOverdueTrendsReport.mockResolvedValue({
      trends: [{ month: "2026-03", overdueCount: 4, avgDaysOverdue: 2.5 }],
    });

    const res = await request(app)
      .get("/api/v1/reports/overdue-trends/export")
      .set("Cookie", "accessToken=fake");

    expect(res.status).toBe(200);
    expect(reportService.toCsv).toHaveBeenCalledWith([
      { month: "2026-03", overdueCount: 4, avgDaysOverdue: 2.5 },
    ]);
    expect(res.headers["content-disposition"]).toContain("overdue-trends-report.csv");
  });

  it("rejects unknown export types", async () => {
    const res = await request(app)
      .get("/api/v1/reports/unknown/export")
      .set("Cookie", "accessToken=fake");

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
