const { listAuditLogs } = require("../services/auditLogService");

jest.mock("../config/prisma", () => ({
  auditLog: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
}));

const prisma = require("../config/prisma");

describe("auditLogService.listAuditLogs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.auditLog.findMany.mockResolvedValue([]);
    prisma.auditLog.count.mockResolvedValue(0);
  });

  it("builds createdAt filter when fromDate is provided", async () => {
    await listAuditLogs({ fromDate: "2025-01-01" });
    const [{ where }] = prisma.auditLog.findMany.mock.calls[0];
    expect(where.createdAt).toBeDefined();
    expect(where.createdAt.gte).toEqual(new Date("2025-01-01"));
  });

  it("builds createdAt filter when toDate is provided", async () => {
    await listAuditLogs({ toDate: "2025-12-31" });
    const [{ where }] = prisma.auditLog.findMany.mock.calls[0];
    expect(where.createdAt).toBeDefined();
    expect(where.createdAt.lte).toBeDefined();
  });

  it("applies action filter", async () => {
    await listAuditLogs({ action: "LOGIN" });
    const [{ where }] = prisma.auditLog.findMany.mock.calls[0];
    expect(where.action).toBe("LOGIN");
  });

  it("returns pagination with correct total pages", async () => {
    prisma.auditLog.count.mockResolvedValue(100);
    const result = await listAuditLogs({ limit: 10 });
    expect(result.pagination.totalPages).toBe(10);
  });

  it("does not set createdAt when no date filters given", async () => {
    await listAuditLogs({ action: "RETURN" });
    const [{ where }] = prisma.auditLog.findMany.mock.calls[0];
    expect(where.createdAt).toBeUndefined();
  });
});
