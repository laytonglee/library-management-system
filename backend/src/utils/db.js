// backend/src/utils/db.js
const { Prisma, BookCopyStatus } = require("@prisma/client");
const prisma = require("../config/prisma");

const MAX_TX_RETRIES = 3;

function createError(message, statusCode) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

function isSerializationConflict(error) {
  return error?.code === "P2034";
}

async function withSerializableTransaction(work) {
  let attempt = 0;

  while (attempt < MAX_TX_RETRIES) {
    try {
      return await prisma.$transaction(
        async (tx) => work(tx),
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      attempt += 1;
      if (!isSerializationConflict(error) || attempt >= MAX_TX_RETRIES) {
        throw error;
      }
    }
  }

  throw createError("Transaction failed after retry attempts", 500);
}

async function getBookCounts(bookId, tx = prisma) {
  const [totalCopies, availableCopies] = await Promise.all([
    tx.bookCopy.count({ where: { bookId } }),
    tx.bookCopy.count({ where: { bookId, status: BookCopyStatus.AVAILABLE } }),
  ]);
  return { totalCopies, availableCopies };
}

module.exports = { createError, withSerializableTransaction, getBookCounts };
