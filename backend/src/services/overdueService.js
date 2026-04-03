// backend/src/services/overdueService.js
const prisma = require("../config/prisma");
const { TransactionStatus } = require("@prisma/client");

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
    status: TransactionStatus.ACTIVE,
    dueDate: { lt: new Date() },
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
    daysOverdue: Math.ceil((now - t.dueDate) / (1000 * 60 * 60 * 24)),
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
    where: { status: TransactionStatus.ACTIVE, dueDate: { lt: now } },
    select: { dueDate: true },
  });

  const totalOverdue = overdueTransactions.length;
  let totalDaysOverdue = 0;
  let maxDaysOverdue = 0;

  for (const t of overdueTransactions) {
    const days = Math.ceil((now - t.dueDate) / (1000 * 60 * 60 * 24));
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

async function runOverdueCheck() {
  const now = new Date();

  const overdueTransactions = await prisma.borrowingTransaction.findMany({
    where: { status: TransactionStatus.ACTIVE, dueDate: { lt: now } },
    include: {
      borrower: { select: { id: true, fullName: true } },
      bookCopy: { select: { book: { select: { title: true } } } },
    },
  });

  for (const t of overdueTransactions) {
    await prisma.borrowingTransaction.update({
      where: { id: t.id },
      data: { status: TransactionStatus.OVERDUE },
    });

    // TODO: enable when notifications are ready
    // const existing = await prisma.notification.findFirst({
    //   where: { transactionId: t.id, type: "OVERDUE_ALERT" },
    // });
    // if (!existing) {
    //   const daysOverdue = Math.ceil((now - t.dueDate) / (1000 * 60 * 60 * 24));
    //   await prisma.notification.create({
    //     data: {
    //       userId: t.borrowerId,
    //       transactionId: t.id,
    //       type: "OVERDUE_ALERT",
    //       message: `"${t.bookCopy.book.title}" is ${daysOverdue} day(s) overdue. Please return it as soon as possible.`,
    //     },
    //   });
    // }
  }

  return {
    overdueCount: overdueTransactions.length,
    newNotifications: 0, // TODO: enable when notifications are ready
  };
}

module.exports = { listOverdue, getOverdueSummary, runOverdueCheck };
