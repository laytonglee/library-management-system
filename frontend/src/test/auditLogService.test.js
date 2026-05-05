import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the axios instance
vi.mock("@/services/api", () => ({
  default: {
    get: vi.fn(),
  },
}));

import api from "@/services/api";
import { getAuditLogs } from "@/services/auditService";

describe("getAuditLogs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls GET /audit-logs with no params by default", async () => {
    api.get.mockResolvedValue({ data: { data: [], pagination: {} } });
    await getAuditLogs();
    expect(api.get).toHaveBeenCalledWith("/audit-logs", { params: undefined });
  });

  it("passes fromDate and toDate params", async () => {
    api.get.mockResolvedValue({ data: { data: [], pagination: {} } });
    await getAuditLogs({ fromDate: "2025-01-01", toDate: "2025-12-31" });
    expect(api.get).toHaveBeenCalledWith("/audit-logs", {
      params: { fromDate: "2025-01-01", toDate: "2025-12-31" },
    });
  });

  it("passes action filter", async () => {
    api.get.mockResolvedValue({ data: { data: [], pagination: {} } });
    await getAuditLogs({ action: "LOGIN" });
    expect(api.get).toHaveBeenCalledWith("/audit-logs", {
      params: { action: "LOGIN" },
    });
  });
});
