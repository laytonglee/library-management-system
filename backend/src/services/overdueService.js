const prisma = require("../config/prisma");
const { TransactionStatus, NotificationType } = require("@prisma/client");
const auditLogger = require("./auditLogger");
const { sendOverdueAlert } = require("./emailService");

const MS_PER_DAY = 1000 * 60 * 60 * 24;

async function listOverdue({ page = 1, limit = 20, sort = "dueDate", order = "asc" } = {}) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const allowedSort = ["dueDate", "checkoutDate", "id"];
  const sortField = allowedSort.includes(sort) ? sort : "dueDate";
  const sortOrder = order === "desc" ? "desc" : "asc";

  const where = { status: { in: [TransactionStatus.ACTIVE, TransactionStatus.OVERDUE] }, dueDate: { lt: new Date() } };

  const [transactions, total] = await Promise.all([
    prisma.borrowingTransaction.findMany({
      where,
      include: {
        borrower: { select: { id: true, fullName: true, email: true } },
        bookCopy: {
          select: {
            id: true, barcode: true,
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
    fineAmount: t.fineAmount ? Number(t.fineAmount) : 0,
  }));

  return {
    overdue: data,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  };
}

async function getOverdueSummary() {
  const now = new Date();
  const overdueTransactions = await prisma.borrowingTransaction.findMany({
    where: { status: { in: [TransactionStatus.ACTIVE, TransactionStatus.OVERDUE] }, dueDate: { lt: now } },
    select: { dueDate: true, fineAmount: true },
  });

  const totalOverdue = overdueTransactions.length;
  let totalDaysOverdue = 0;
  let maxDaysOverdue = 0;
  let totalFines = 0;

  for (const t of overdueTransactions) {
    const days = Math.ceil((now - t.dueDate) / MS_PER_DAY);
    totalDaysOverdue += days;
    if (days > maxDaysOverdue) maxDaysOverdue = days;
    totalFines += t.fineAmount ? Number(t.fineAmount) : 0;
  }

  return {
    totalOverdue,
    averageDaysOverdue: totalOverdue > 0 ? Math.round(totalDaysOverdue / totalOverdue) : 0,
    maxDaysOverdue,
    totalFines: Number(totalFines.toFixed(2)),
  };
}

async function detectAndFlagOverdue() {
  const overdueTransactions = await prisma.borrowingTransaction.findMany({
    where: { status: TransactionStatus.ACTIVE, dueDate: { lt: new Date() } },
    include: {
      borrower: { select: { id: true, fullName: true, email: true } },
      bookCopy: { select: { book: { select: { title: true } } } },
    },
  });

  // Fetch all borrowing policies for fine calculation
  const policies = await prisma.borrowingPolicy.findMany({
    include: { role: { select: { name: true } } },
  });

  // Fetch borrower roles
  const borrowerIds = [...new Set(overdueTransactions.map((t) => t.borrowerId))];
  const borrowers = await prisma.user.findMany({
    where: { id: { in: borrowerIds } },
    select: { id: true, roleId: true, role: { select: { id: true } } },
  });
  const borrowerRoleMap = Object.fromEntries(borrowers.map((b) => [b.id, b.roleId]));
  const policyMap = Object.fromEntries(policies.map((p) => [p.roleId, Number(p.finePerDay)]));

  let flagged = 0;
  const now = new Date();

  for (const t of overdueTransactions) {
    const title = t.bookCopy.book.title;
    const dueDateStr = t.dueDate.toISOString().split("T")[0];
    const daysOverdue = Math.ceil((now - t.dueDate) / MS_PER_DAY);
    const roleId = borrowerRoleMap[t.borrowerId];
    const finePerDay = policyMap[roleId] ?? 0.50;
    const fineAmount = parseFloat((daysOverdue * finePerDay).toFixed(2));

    await prisma.$transaction(async (tx) => {
      await tx.borrowingTransaction.update({
        where: { id: t.id },
        data: { status: TransactionStatus.OVERDUE, daysOverdue, fineAmount },
      });

      await tx.notification.create({
        data: {
          userId: t.borrowerId,
          transactionId: t.id,
          type: NotificationType.OVERDUE_ALERT,
          message: `"${title}" is overdue (due ${dueDateStr}). Fine: $${fineAmount.toFixed(2)}`,
        },
      });

      await auditLogger.log(tx, {
        actorId: null,
        action: "OVERDUE_FLAG",
        targetType: "transaction",
        targetId: t.id,
        details: { dueDate: t.dueDate, borrowerId: t.borrowerId, daysOverdue, fineAmount },
      });
    });

    // Send email notification
    try {
      await sendOverdueAlert({
        to: t.borrower.email,
        fullName: t.borrower.fullName,
        bookTitle: title,
        dueDate: dueDateStr,
        daysOverdue,
        fineAmount,
      });
    } catch (err) {
      console.error(`[EMAIL] Failed to send overdue alert to ${t.borrower.email}:`, err.message);
    }

    flagged += 1;
  }

  return flagged;
}

async function runOverdueCheck() {
  const overdueCount = await detectAndFlagOverdue();
  return { overdueCount, newNotifications: overdueCount };
}

async function getOverdueDistribution() {
  const now = new Date();
  const overdueItems = await prisma.borrowingTransaction.findMany({
    where: { status: { in: [TransactionStatus.ACTIVE, TransactionStatus.OVERDUE] }, dueDate: { lt: now } },
    select: {
      dueDate: true,
      fineAmount: true,
      bookCopy: { select: { book: { select: { title: true } } } },
    },
  });

  return overdueItems.map((t) => ({
    title: t.bookCopy.book.title,
    daysOverdue: Math.ceil((now - new Date(t.dueDate)) / MS_PER_DAY),
    fineAmount: t.fineAmount ? Number(t.fineAmount) : 0,
  }));
}

module.exports = { listOverdue, getOverdueSummary, runOverdueCheck, detectAndFlagOverdue, getOverdueDistribution };
