const request = require("supertest");

jest.mock("jsonwebtoken");
jest.mock("../services/overdueService", () => ({
  getOverdueTransactions: jest.fn(),
  getOverdueSummary: jest.fn(),
  detectAndFlagOverdue: jest.fn(),
}));

const jwt = require("jsonwebtoken");
const overdueService = require("../services/overdueService");
const app = require("../app");

function fakeUser(role = "librarian", userId = 42) {
  return { userId, role, username: `${role}-user` };
}

beforeEach(() => {
  jest.clearAllMocks();
  jwt.verify.mockReturnValue(fakeUser());
});

describe("Overdue API", () => {
  it("lists overdue transactions for librarians", async () => {
    overdueService.getOverdueTransactions.mockResolvedValue({
      transactions: [{ id: 1, daysOverdue: 4 }],
      pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });

    const res = await request(app)
      .get("/api/v1/overdue?borrowerId=9")
      .set("Cookie", "accessToken=fake");

    expect(res.status).toBe(200);
    expect(res.body.data.transactions[0].daysOverdue).toBe(4);
    expect(overdueService.getOverdueTransactions).toHaveBeenCalledWith(
      expect.objectContaining({ borrowerId: "9" }),
    );
  });

  it("returns overdue summary statistics", async () => {
    overdueService.getOverdueSummary.mockResolvedValue({
      totalOverdue: 3,
      avgDaysOverdue: 4.7,
      maxDaysOverdue: 12,
    });

    const res = await request(app)
      .get("/api/v1/overdue/summary")
      .set("Cookie", "accessToken=fake");

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(
      expect.objectContaining({
        totalOverdue: 3,
        avgDaysOverdue: 4.7,
        maxDaysOverdue: 12,
      }),
    );
  });

  it("manually triggers overdue detection for librarians", async () => {
    overdueService.detectAndFlagOverdue.mockResolvedValue(5);

    const res = await request(app)
      .post("/api/v1/overdue/run-check")
      .set("Cookie", "accessToken=fake");

    expect(res.status).toBe(200);
    expect(res.body.data.count).toBe(5);
    expect(res.body.message).toContain("Flagged 5 overdue transaction(s)");
  });

  it("blocks users without overdue-management permission from manual detection", async () => {
    jwt.verify.mockReturnValue(fakeUser("student", 9));

    const res = await request(app)
      .post("/api/v1/overdue/run-check")
      .set("Cookie", "accessToken=fake");

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(overdueService.detectAndFlagOverdue).not.toHaveBeenCalled();
  });
});
