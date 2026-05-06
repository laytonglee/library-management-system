// backend/src/services/overdueService.js
const prisma = require("../config/prisma");
const { TransactionStatus, NotificationType } = require("@prisma/client");
const auditLogger = require("./auditLogger");
const MS_PER_DAY = 1000 * 60 * 60 * 24;

async function listOverdue({
  page = 1,
  limit = 20,
  sort = "dueDate",
  order = "asc",
} = {}) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const allowedSort = ["dueDate", "checkoutDate", "id"];
  const sortField = allowedSort.includes(sort) ? sort : "dueDate";
  const sortOrder = order === "desc" ? "desc" : "asc";

  const where = {
    status: TransactionStatus.OVERDUE,
  };

  const [transactions, total] = await Promise.all([
    prisma.borrowingTransaction.findMany({
      where,
      include: {
        borrower: { select: { id: true, fullName: true, email: true } },
        bookCopy: {
          select: {
            id: true,
            barcode: true,
            book: { select: { id: true, title: true, author: true } },
          },
        },
      },
      orderBy: { [sortField]: sortOrder },
      skip,
      take: limitNum,
    }),
    prisma.borrowingTransaction.count({ where }),
  ]);

  const now = new Date();
  const data = transactions.map((t) => ({
    ...t,
    daysOverdue: Math.ceil((now - t.dueDate) / MS_PER_DAY),
  }));

  return {
    overdue: data,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  };
}

async function getOverdueSummary() {
  const now = new Date();
  const overdueTransactions = await prisma.borrowingTransaction.findMany({
    where: { status: TransactionStatus.OVERDUE },
    select: { dueDate: true },
  });

  const totalOverdue = overdueTransactions.length;
  let totalDaysOverdue = 0;
  let maxDaysOverdue = 0;

  for (const t of overdueTransactions) {
    const days = Math.ceil((now - t.dueDate) / MS_PER_DAY);
    totalDaysOverdue += days;
    if (days > maxDaysOverdue) maxDaysOverdue = days;
  }

  return {
    totalOverdue,
    averageDaysOverdue:
      totalOverdue > 0 ? Math.round(totalDaysOverdue / totalOverdue) : 0,
    maxDaysOverdue,
  };
}

// REQ-11, REQ-12 / UC-06 — TC-06-10
// Status update + notification create + audit log are atomic per transaction.
async function detectAndFlagOverdue() {
  const overdueTransactions = await prisma.borrowingTransaction.findMany({
    where: {
      status: TransactionStatus.ACTIVE,
      dueDate: { lt: new Date() },
    },
    include: {
      borrower: { select: { id: true, fullName: true } },
      bookCopy: { select: { book: { select: { title: true } } } },
    },
  });

  let flagged = 0;
  for (const t of overdueTransactions) {
    const title = t.bookCopy.book.title;
    const dueDateStr = t.dueDate.toISOString().split("T")[0];

    await prisma.$transaction(async (tx) => {
      await tx.borrowingTransaction.update({
        where: { id: t.id },
        data: { status: TransactionStatus.OVERDUE },
      });

      await tx.notification.create({
        data: {
          userId: t.borrowerId,
          transactionId: t.id,
          type: NotificationType.OVERDUE_ALERT,
          message: `"${title}" is overdue (due ${dueDateStr})`,
        },
      });

      await auditLogger.log(tx, {
        actorId: null,
        action: "OVERDUE_FLAG",
        targetType: "transaction",
        targetId: t.id,
        details: { dueDate: t.dueDate, borrowerId: t.borrowerId },
      });
    });

    flagged += 1;
  }

  return flagged;
}

// REQ-12 — proactive DUE_REMINDER sent once per transaction when due date is within 2 days
async function sendDueReminders() {
  const now = new Date();
  const in2Days = new Date(now.getTime() + 2 * MS_PER_DAY);

  const upcoming = await prisma.borrowingTransaction.findMany({
    where: {
      status: TransactionStatus.ACTIVE,
      dueDate: { gte: now, lte: in2Days },
    },
    include: {
      bookCopy: { select: { book: { select: { title: true } } } },
      notifications: {
        where: { type: NotificationType.DUE_REMINDER },
        select: { id: true },
      },
    },
  });

  let reminded = 0;
  for (const t of upcoming) {
    if (t.notifications.length > 0) continue;
    const dueDateStr = t.dueDate.toISOString().split("T")[0];
    const title = t.bookCopy.book.title;
    await prisma.notification.create({
      data: {
        userId: t.borrowerId,
        transactionId: t.id,
        type: NotificationType.DUE_REMINDER,
        message: `"${title}" is due on ${dueDateStr} — please return it on time`,
      },
    });
    reminded++;
  }
  return reminded;
}

async function runOverdueCheck() {
  const overdueCount = await detectAndFlagOverdue();
  return { overdueCount, newNotifications: overdueCount };
}

async function getOverdueDistribution() {
  const now = new Date();
  const overdueItems = await prisma.borrowingTransaction.findMany({
    where: {
      status: TransactionStatus.OVERDUE,
    },
    select: {
      dueDate: true,
      bookCopy: {
        select: {
          book: { select: { title: true } },
        },
      },
    },
  });

  const distribution = overdueItems.map((t) => ({
    title: t.bookCopy.book.title,
    daysOverdue: Math.ceil((now - new Date(t.dueDate)) / MS_PER_DAY),
  }));

  return distribution;
  // Returns: [{ title: "Sapiens", daysOverdue: 5 }, { title: "1984", daysOverdue: 45 }]
}

// REQ-12 — Send DUE_REMINDER for active loans due within the next 3 days.
// Skips transactions that already have an unread reminder to avoid duplicates.
const DUE_REMINDER_DAYS = 3;

async function sendDueReminders() {
  const now = new Date();
  const soon = new Date(now.getTime() + DUE_REMINDER_DAYS * MS_PER_DAY);

  const upcomingTransactions = await prisma.borrowingTransaction.findMany({
    where: {
      status: TransactionStatus.ACTIVE,
      dueDate: { gte: now, lte: soon },
    },
    include: {
      borrower: { select: { id: true } },
      bookCopy: { select: { book: { select: { title: true } } } },
      notifications: {
        where: { type: NotificationType.DUE_REMINDER, isRead: false },
        select: { id: true },
      },
    },
  });

  let sent = 0;
  for (const t of upcomingTransactions) {
    if (t.notifications.length > 0) continue;

    const dueDateStr = t.dueDate.toISOString().split("T")[0];
    const daysLeft = Math.ceil((t.dueDate - now) / MS_PER_DAY);
    const title = t.bookCopy.book.title;

    await prisma.notification.create({
      data: {
        userId: t.borrowerId,
        transactionId: t.id,
        type: NotificationType.DUE_REMINDER,
        message: `Reminder: "${title}" is due in ${daysLeft} day${daysLeft !== 1 ? "s" : ""} (${dueDateStr}).`,
      },
    });

    sent += 1;
  }

  return sent;
}

module.exports = {
  listOverdue,
  getOverdueSummary,
  runOverdueCheck,
  detectAndFlagOverdue,
  sendDueReminders,
  getOverdueDistribution,
  sendDueReminders,
};
