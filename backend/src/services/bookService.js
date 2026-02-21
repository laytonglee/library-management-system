const { Prisma, BookCopyStatus, TransactionStatus } = require("@prisma/client");
const prisma = require("../config/prisma");

const DEFAULT_LOAN_DURATION_DAYS = 14;
const DEFAULT_MAX_BOOKS_ALLOWED = 3;
const MAX_TX_RETRIES = 3;

function createError(message, statusCode) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
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
    tx.bookCopy.count({
      where: { bookId, status: BookCopyStatus.AVAILABLE },
    }),
  ]);

  return { totalCopies, availableCopies };
}

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

async function getBorrowingPolicy(tx, borrowerId) {
  const borrower = await tx.user.findUnique({
    where: { id: borrowerId },
    select: {
      id: true,
      isActive: true,
      roleId: true,
    },
  });

  if (!borrower) {
    throw createError("Borrower not found", 404);
  }

  if (!borrower.isActive) {
    throw createError("Borrower account is deactivated", 403);
  }

  const policy = await tx.borrowingPolicy.findUnique({
    where: { roleId: borrower.roleId },
    select: { loanDurationDays: true, maxBooksAllowed: true },
  });

  return {
    loanDurationDays: policy?.loanDurationDays || DEFAULT_LOAN_DURATION_DAYS,
    maxBooksAllowed: policy?.maxBooksAllowed || DEFAULT_MAX_BOOKS_ALLOWED,
  };
}

async function checkoutBook({
  borrowerId,
  librarianId,
  bookCopyId,
  checkoutDate = new Date(),
  notes,
}) {
  if (!borrowerId || !librarianId || !bookCopyId) {
    throw createError("borrowerId, librarianId, and bookCopyId are required", 400);
  }

  return withSerializableTransaction(async (tx) => {
    const librarian = await tx.user.findUnique({
      where: { id: librarianId },
      select: { id: true, isActive: true },
    });

    if (!librarian) {
      throw createError("Librarian not found", 404);
    }

    if (!librarian.isActive) {
      throw createError("Librarian account is deactivated", 403);
    }

    const [policy, activeBorrowCount] = await Promise.all([
      getBorrowingPolicy(tx, borrowerId),
      tx.borrowingTransaction.count({
        where: { borrowerId, status: TransactionStatus.ACTIVE },
      }),
    ]);

    if (activeBorrowCount >= policy.maxBooksAllowed) {
      throw createError("Borrower has reached the maximum allowed active loans", 409);
    }

    const copy = await tx.bookCopy.findUnique({
      where: { id: bookCopyId },
      select: {
        id: true,
        bookId: true,
        status: true,
      },
    });

    if (!copy) {
      throw createError("Book copy not found", 404);
    }

    const checkoutUpdate = await tx.bookCopy.updateMany({
      where: {
        id: bookCopyId,
        status: BookCopyStatus.AVAILABLE,
      },
      data: { status: BookCopyStatus.BORROWED },
    });

    if (checkoutUpdate.count !== 1) {
      throw createError("Book copy is not available for checkout", 409);
    }

    const dueDate = addDays(checkoutDate, policy.loanDurationDays);

    const transaction = await tx.borrowingTransaction.create({
      data: {
        bookCopyId,
        borrowerId,
        librarianId,
        checkoutDate,
        dueDate,
        status: TransactionStatus.ACTIVE,
        notes,
      },
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
    });

    const counts = await getBookCounts(copy.bookId, tx);

    return {
      transaction,
      inventory: {
        bookId: copy.bookId,
        ...counts,
      },
    };
  });
}

async function returnBook({
  bookCopyId,
  notes,
  returnDate = new Date(),
}) {
  if (!bookCopyId) {
    throw createError("bookCopyId is required", 400);
  }

  return withSerializableTransaction(async (tx) => {
    const activeTransaction = await tx.borrowingTransaction.findFirst({
      where: {
        bookCopyId,
        status: TransactionStatus.ACTIVE,
      },
      orderBy: { checkoutDate: "desc" },
      select: { id: true, bookCopyId: true },
    });

    if (!activeTransaction) {
      throw createError("No active borrowing transaction found for this copy", 409);
    }

    const returnUpdate = await tx.bookCopy.updateMany({
      where: {
        id: bookCopyId,
        status: BookCopyStatus.BORROWED,
      },
      data: { status: BookCopyStatus.AVAILABLE },
    });

    if (returnUpdate.count !== 1) {
      throw createError("Book copy state conflict during return", 409);
    }

    const transaction = await tx.borrowingTransaction.update({
      where: { id: activeTransaction.id },
      data: {
        returnDate,
        status: TransactionStatus.RETURNED,
        notes,
      },
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
    });

    const counts = await getBookCounts(transaction.bookCopy.book.id, tx);

    return {
      transaction,
      inventory: {
        bookId: transaction.bookCopy.book.id,
        ...counts,
      },
    };
  });
}

module.exports = {
  addBookCopy,
  checkoutBook,
  createBook,
  getBookById,
  getBookCounts,
  returnBook,
  updateBookCopy,
};
 