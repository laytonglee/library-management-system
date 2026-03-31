const { BookCopyStatus, TransactionStatus } = require("@prisma/client");
const prisma = require("../config/prisma");
const { createError, withSerializableTransaction, getBookCounts } = require("../utils/db");

async function getBookById(bookId) {
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    include: {
      category: true,
    },
  });

  if (!book) {
    throw createError("Book not found", 404);
  }

  const counts = await getBookCounts(bookId);
  return { ...book, ...counts };
}

async function createBook({
  title,
  author,
  isbn,
  categoryId,
  publisher,
  publicationYear,
  description,
  coverImageUrl,
  totalCopies = 1,
}) {
  if (!title || !author) {
    throw createError("title and author are required", 400);
  }

  if (!Number.isInteger(totalCopies) || totalCopies < 1) {
    throw createError("totalCopies must be a positive integer", 400);
  }

  return withSerializableTransaction(async (tx) => {
    const book = await tx.book.create({
      data: {
        title,
        author,
        isbn,
        categoryId,
        publisher,
        publicationYear,
        description,
        coverImageUrl,
      },
    });

    await tx.bookCopy.createMany({
      data: Array.from({ length: totalCopies }, () => ({
        bookId: book.id,
        status: BookCopyStatus.AVAILABLE,
      })),
    });

    const counts = await getBookCounts(book.id, tx);
    return { ...book, ...counts };
  });
}

async function addBookCopy(bookId, { barcode, location, status } = {}) {
  return withSerializableTransaction(async (tx) => {
    const book = await tx.book.findUnique({
      where: { id: bookId },
      select: { id: true },
    });

    if (!book) {
      throw createError("Book not found", 404);
    }

    const copy = await tx.bookCopy.create({
      data: {
        bookId,
        barcode,
        location,
        status: status || BookCopyStatus.AVAILABLE,
      },
    });

    const counts = await getBookCounts(bookId, tx);
    return { copy, ...counts };
  });
}

async function updateBookCopy(bookId, copyId, data = {}) {
  return withSerializableTransaction(async (tx) => {
    const existing = await tx.bookCopy.findFirst({
      where: { id: copyId, bookId },
      select: { id: true },
    });

    if (!existing) {
      throw createError("Book copy not found", 404);
    }

    if (data.status === BookCopyStatus.AVAILABLE) {
      const activeTx = await tx.borrowingTransaction.findFirst({
        where: {
          bookCopyId: copyId,
          status: TransactionStatus.ACTIVE,
        },
        select: { id: true },
      });

      if (activeTx) {
        throw createError(
          "Cannot mark copy as AVAILABLE while borrowing transaction is ACTIVE",
          409,
        );
      }
    }

    const copy = await tx.bookCopy.update({
      where: { id: copyId },
      data: {
        barcode: data.barcode,
        location: data.location,
        status: data.status,
      },
    });

    const counts = await getBookCounts(bookId, tx);
    return { copy, ...counts };
  });
}

module.exports = {
  addBookCopy,
  createBook,
  getBookById,
  getBookCounts,
  updateBookCopy,
};
