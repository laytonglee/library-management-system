const request = require("supertest");

jest.mock("jsonwebtoken");
jest.mock("../services/auditLogService", () => ({
  listAuditLogs: jest.fn(),
}));

const jwt = require("jsonwebtoken");
const auditLogService = require("../services/auditLogService");
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
    auditLogService.listAuditLogs.mockResolvedValue({
      logs: [
        {
          id: 99,
          action: "CHECKOUT",
          targetType: "transaction",
          actorId: 42,
          actor: { id: 42, fullName: "Lib User", username: "lib", role: { name: "librarian" } },
        },
      ],
      pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
    });

    const res = await request(app)
      .get("/api/v1/audit-logs?action=CHECKOUT&actorId=42&targetType=transaction")
      .set("Cookie", "accessToken=fake");

    expect(res.status).toBe(200);
    expect(res.body.data[0].id).toBe(99);
    expect(auditLogService.listAuditLogs).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "CHECKOUT",
        actorId: "42",
        targetType: "transaction",
      }),
    );
  });

  it("blocks users without view_audit_logs permission", async () => {
    jwt.verify.mockReturnValue(fakeUser("student", 9));

    const res = await request(app)
      .get("/api/v1/audit-logs")
      .set("Cookie", "accessToken=fake");

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
