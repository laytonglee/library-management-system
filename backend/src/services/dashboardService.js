// backend/src/services/dashboardService.js
const prisma = require("../config/prisma");
const { TransactionStatus, BookCopyStatus } = require("@prisma/client");

async function getDashboardStats() {
  const now = new Date();

  const [
    totalBooks,
    totalMembers,
    activeLoans,
    overdueCount,
    recentTransactions,
    overdueItems,
    categories,
    popularBooks,
  ] = await Promise.all([
    prisma.book.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.borrowingTransaction.count({
      where: { status: TransactionStatus.ACTIVE },
    }),
    prisma.borrowingTransaction.count({
      where: { status: TransactionStatus.ACTIVE, dueDate: { lt: now } },
    }),
    prisma.borrowingTransaction.findMany({
      take: 10,
      orderBy: { checkoutDate: "desc" },
      include: {
        borrower: { select: { id: true, fullName: true, email: true } },
        bookCopy: { select: { book: { select: { id: true, title: true } } } },
      },
    }),
    prisma.borrowingTransaction.findMany({
      where: { status: TransactionStatus.ACTIVE, dueDate: { lt: now } },
      take: 10,
      orderBy: { dueDate: "asc" },
      include: {
        borrower: { select: { id: true, fullName: true, email: true } },
        bookCopy: { select: { book: { select: { id: true, title: true } } } },
      },
    }),
    prisma.category.findMany({
      include: { books: { include: { copies: { select: { status: true } } } } },
    }),
    prisma.book.findMany({
      take: 5,
      include: {
        _count: { select: { copies: true } },
        copies: { select: { transactions: { select: { id: true } } } },
      },
    }),
  ]);

  const formattedTransactions = recentTransactions.map((t) => ({
    id: t.id,
    borrower: t.borrower.fullName,
    book: t.bookCopy.book.title,
    type: t.returnDate ? "return" : "checkout",
    date: (t.returnDate || t.checkoutDate).toISOString().slice(0, 10),
    avatar: t.borrower.fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2),
  }));

  const formattedOverdue = overdueItems.map((t) => ({
    id: t.id,
    borrower: t.borrower.fullName,
    book: t.bookCopy.book.title,
    dueDate: t.dueDate.toISOString().slice(0, 10),
    daysOverdue: Math.ceil((now - t.dueDate) / (1000 * 60 * 60 * 24)),
    email: t.borrower.email,
  }));

  const popularWithCount = popularBooks
    .map((book) => ({
      id: book.id,
      title: book.title,
      author: book.author,
      borrows: book.copies.reduce((sum, c) => sum + c.transactions.length, 0),
    }))
    .sort((a, b) => b.borrows - a.borrows);

  const categoryBreakdown = categories.map((cat) => {
    const totalCopies = cat.books.reduce((s, b) => s + b.copies.length, 0);
    const availableCopies = cat.books.reduce(
      (s, b) =>
        s +
        b.copies.filter((c) => c.status === BookCopyStatus.AVAILABLE).length,
      0,
    );
    return {
      name: cat.name,
      count: cat.books.length,
      percent:
        totalCopies > 0 ? Math.round((availableCopies / totalCopies) * 100) : 0,
    };
  });

  return {
    stats: {
      totalBooks,
      totalMembers,
      activeLoans,
      overdueBooks: overdueCount,
    },
    recentTransactions: formattedTransactions,
    popularBooks: popularWithCount,
    overdueItems: formattedOverdue,
    categoryBreakdown,
  };
}

module.exports = { getDashboardStats };
