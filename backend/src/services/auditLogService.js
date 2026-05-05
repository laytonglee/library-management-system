// backend/src/services/auditLogService.js
const prisma = require("../config/prisma");

async function listAuditLogs({
  action,
  actorId,
  targetType,
  page = 1,
  limit = 50,
} = {}) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
  const skip = (pageNum - 1) * limitNum;

  const where = {};
  if (action) where.action = action;
  if (actorId) where.actorId = parseInt(actorId, 10);
  if (targetType) where.targetType = targetType;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        actor: {
          select: {
            id: true,
            fullName: true,
            username: true,
            role: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limitNum,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  };
}

module.exports = { listAuditLogs };
