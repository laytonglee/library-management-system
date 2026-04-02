// backend/src/services/notificationService.js
const prisma = require("../config/prisma");
const { createError } = require("../utils/db");

async function listNotifications(userId, { page = 1, limit = 50 } = {}) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const skip = (pageNum - 1) * limitNum;

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { sentAt: "desc" },
      skip,
      take: limitNum,
    }),
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  return {
    notifications,
    unreadCount,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  };
}

async function markAsRead(id, userId) {
  const notification = await prisma.notification.findFirst({
    where: { id, userId },
  });
  if (!notification) throw createError("Notification not found", 404);

  return prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });
}

async function markAllAsRead(userId) {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}

async function deleteNotification(id, userId) {
  const notification = await prisma.notification.findFirst({
    where: { id, userId },
  });
  if (!notification) throw createError("Notification not found", 404);

  await prisma.notification.delete({ where: { id } });
}

module.exports = {
  listNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
