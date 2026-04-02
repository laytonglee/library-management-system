// backend/src/services/transactionService.js
const prisma = require("../config/prisma");
const { createError } = require("../utils/db");

const TX_INCLUDE = {
  borrower: { select: { id: true, fullName: true, email: true } },
  librarian: { select: { id: true, fullName: true } },
  bookCopy: {
    select: {
      id: true,
      barcode: true,
      book: { select: { id: true, title: true, author: true } },
    },
  },
};

async function listTransactions({ status, page = 1, limit = 20 } = {}) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const where = {};
  if (status) where.status = status;

  const [transactions, total] = await Promise.all([
    prisma.borrowingTransaction.findMany({
      where,
      include: TX_INCLUDE,
      orderBy: { checkoutDate: "desc" },
      skip,
      take: limitNum,
    }),
    prisma.borrowingTransaction.count({ where }),
  ]);

  return {
    transactions,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  };
}

async function getTransactionById(id) {
  const transaction = await prisma.borrowingTransaction.findUnique({
    where: { id },
    include: TX_INCLUDE,
  });
  if (!transaction) throw createError("Transaction not found", 404);
  return transaction;
}

async function getActiveTransactions() {
  return prisma.borrowingTransaction.findMany({
    where: { status: "ACTIVE" },
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
    orderBy: { dueDate: "asc" },
  });
}

async function getUserTransactions(
  userId,
  { page = 1, limit = 20, status } = {},
) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const where = { borrowerId: userId };
  if (status) where.status = status;

  const [transactions, total] = await Promise.all([
    prisma.borrowingTransaction.findMany({
      where,
      include: {
        bookCopy: {
          select: {
            id: true,
            barcode: true,
            book: { select: { id: true, title: true, author: true } },
          },
        },
      },
      orderBy: { checkoutDate: "desc" },
      skip,
      take: limitNum,
    }),
    prisma.borrowingTransaction.count({ where }),
  ]);

  return {
    transactions,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  };
}

module.exports = {
  listTransactions,
  getTransactionById,
  getActiveTransactions,
  getUserTransactions,
};
