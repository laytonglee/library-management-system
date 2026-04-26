const prisma = require("../config/prisma");

function toCsv(rows) {
  if (!rows || rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h] ?? "";
          const str = String(val);
          return str.includes(",") || str.includes('"') || str.includes("\n")
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(","),
    ),
  ];
  return lines.join("\n");
}

async function getInventoryReport() {
  const [totalBooks, copyGroups] = await Promise.all([
    prisma.book.count(),
    prisma.bookCopy.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
  ]);

  const totalCopies = copyGroups.reduce((sum, g) => sum + g._count.id, 0);
  const statusBreakdown = Object.fromEntries(
    copyGroups.map((g) => [g.status, g._count.id]),
  );

  return { totalBooks, totalCopies, statusBreakdown };
}

async function getBorrowingReport({ startDate, endDate } = {}) {
  const where = {};
  if (startDate || endDate) {
    where.checkoutDate = {};
    if (startDate) where.checkoutDate.gte = new Date(startDate);
    if (endDate) where.checkoutDate.lte = new Date(endDate);
  }

  const transactions = await prisma.borrowingTransaction.findMany({
    where,
    select: {
      checkoutDate: true,
      bookCopy: {
        select: {
          book: {
            select: { category: { select: { name: true } } },
          },
        },
      },
    },
  });

  const byMonth = {};
  const byCategory = {};

  for (const t of transactions) {
    const month = t.checkoutDate.toISOString().slice(0, 7);
    byMonth[month] = (byMonth[month] || 0) + 1;

    const catName = t.bookCopy.book.category?.name || "Uncategorized";
    byCategory[catName] = (byCategory[catName] || 0) + 1;
  }

  return { totalCheckouts: transactions.length, byMonth, byCategory };
}

async function getPopularBooksReport({ limit = 10 } = {}) {
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));

  const transactions = await prisma.borrowingTransaction.findMany({
    select: {
      bookCopy: {
        select: {
          book: {
            select: {
              id: true,
              title: true,
              author: true,
              category: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  const counts = new Map();
  for (const t of transactions) {
    const book = t.bookCopy.book;
    if (!counts.has(book.id)) {
      counts.set(book.id, {
        book: {
          title: book.title,
          author: book.author,
          category: { name: book.category?.name || "Uncategorized" },
        },
        borrowCount: 0,
      });
    }
    counts.get(book.id).borrowCount++;
  }

  return [...counts.values()]
    .sort((a, b) => b.borrowCount - a.borrowCount)
    .slice(0, limitNum);
}

async function getOverdueTrendsReport() {
  const transactions = await prisma.borrowingTransaction.findMany({
    where: { status: "OVERDUE" },
    select: { dueDate: true },
  });

  const monthData = {};
  const now = new Date();

  for (const t of transactions) {
    const month = t.dueDate.toISOString().slice(0, 7);
    if (!monthData[month]) monthData[month] = { count: 0, totalDays: 0 };
    const days = Math.max(
      0,
      Math.ceil((now - t.dueDate) / (1000 * 60 * 60 * 24)),
    );
    monthData[month].count++;
    monthData[month].totalDays += days;
  }

  const trends = Object.entries(monthData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { count, totalDays }]) => ({
      month,
      overdueCount: count,
      avgDaysOverdue:
        count > 0 ? Math.round((totalDays / count) * 10) / 10 : 0,
    }));

  return { trends };
}

module.exports = {
  toCsv,
  getInventoryReport,
  getBorrowingReport,
  getPopularBooksReport,
  getOverdueTrendsReport,
};
