const request = require("supertest");

jest.mock("jsonwebtoken");
jest.mock("../config/prisma", () => ({
  auditLog: {
    count: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
}));

const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const app = require("../app");

function fakeUser(role = "admin", userId = 1) {
  return { userId, role, username: `${role}-user` };
}

beforeEach(() => {
  jest.clearAllMocks();
  jwt.verify.mockReturnValue(fakeUser());
});

describe("Audit Logs API", () => {
  it("lists audit logs with filters and pagination for admins", async () => {
    prisma.auditLog.count.mockResolvedValue(1);
    prisma.auditLog.findMany.mockResolvedValue([
      {
        id: 99,
        action: "CHECKOUT",
        targetType: "transaction",
        actorId: 42,
        actor: { id: 42, fullName: "Lib User", username: "lib", role: { name: "librarian" } },
      },
    ]);

    const res = await request(app)
      .get("/api/v1/audit-logs?action=CHECKOUT&actorId=42&targetType=transaction&startDate=2026-03-01&endDate=2026-03-31&page=2&limit=10&sortBy=action&sortOrder=asc")
      .set("Cookie", "accessToken=fake");

    expect(res.status).toBe(200);
    expect(res.body.data.logs[0].id).toBe(99);
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          action: "CHECKOUT",
          actorId: 42,
          targetType: "transaction",
          createdAt: expect.objectContaining({
            gte: expect.any(Date),
            lte: expect.any(Date),
          }),
        }),
        skip: 10,
        take: 10,
        orderBy: { action: "asc" },
      }),
    );
  });

  it("returns a single audit log detail entry for admins", async () => {
    prisma.auditLog.findUnique.mockResolvedValue({
      id: 7,
      action: "CREATE_USER",
      actor: { id: 1, fullName: "Admin", username: "admin", role: { name: "admin" } },
    });

    const res = await request(app)
      .get("/api/v1/audit-logs/7")
      .set("Cookie", "accessToken=fake");

    expect(res.status).toBe(200);
    expect(res.body.data.log.id).toBe(7);
  });

  it("rejects invalid audit log ids", async () => {
    const res = await request(app)
      .get("/api/v1/audit-logs/not-a-number")
      .set("Cookie", "accessToken=fake");

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("blocks non-admin users from audit log access", async () => {
    jwt.verify.mockReturnValue(fakeUser("librarian", 42));

    const res = await request(app)
      .get("/api/v1/audit-logs")
      .set("Cookie", "accessToken=fake");

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
