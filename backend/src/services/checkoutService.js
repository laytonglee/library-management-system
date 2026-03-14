// backend/src/services/checkoutService.js
const { BookCopyStatus, TransactionStatus } = require("@prisma/client");
const { createError, withSerializableTransaction, getBookCounts } = require("../utils/db");
const auditLogger = require("./auditLogger");

const DEFAULT_LOAN_DURATION_DAYS = 14;
const DEFAULT_MAX_BOOKS_ALLOWED = 3;

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function calcDaysOverdue(returnDate, dueDate) {
  if (returnDate <= dueDate) return null;
  return Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24));
}

async function getBorrowingPolicy(tx, borrowerId) {
  const borrower = await tx.user.findUnique({
    where: { id: borrowerId },
    select: { id: true, isActive: true, roleId: true },
  });

  if (!borrower) throw createError("Borrower not found", 404);
  if (!borrower.isActive) throw createError("Borrower account is deactivated", 403);

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
  ipAddress,
}) {
  if (!borrowerId || !librarianId || !bookCopyId) {
    throw createError("borrowerId, librarianId, and bookCopyId are required", 400);
  }

  return withSerializableTransaction(async (tx) => {
    const librarian = await tx.user.findUnique({
      where: { id: librarianId },
      select: { id: true, isActive: true },
    });

    if (!librarian) throw createError("Librarian not found", 404);
    if (!librarian.isActive) throw createError("Librarian account is deactivated", 403);

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
      select: { id: true, bookId: true, status: true },
    });

    if (!copy) throw createError("Book copy not found", 404);

    const checkoutUpdate = await tx.bookCopy.updateMany({
      where: { id: bookCopyId, status: BookCopyStatus.AVAILABLE },
      data: { status: BookCopyStatus.BORROWED },
    });

    if (checkoutUpdate.count !== 1) {
      throw createError("Book copy is not available for checkout", 409);
    }

    const dueDate = addDays(checkoutDate, policy.loanDurationDays);

    const transaction = await tx.borrowingTransaction.create({
      data: { bookCopyId, borrowerId, librarianId, checkoutDate, dueDate, status: TransactionStatus.ACTIVE, notes },
      include: {
        borrower: { select: { id: true, fullName: true, email: true } },
        bookCopy: {
          select: {
            id: true, barcode: true,
            book: { select: { id: true, title: true, author: true } },
          },
        },
      },
    });

    const counts = await getBookCounts(copy.bookId, tx);

    await auditLogger.log(tx, {
      actorId: librarianId,
      action: "CHECKOUT",
      targetType: "transaction",
      details: { transactionId: transaction.id, borrowerId, bookCopyId, dueDate: transaction.dueDate },
      ipAddress,
    });

    return { transaction, inventory: { bookId: copy.bookId, ...counts } };
  });
}

async function returnBook({
  bookCopyId,
  librarianId,
  notes,
  returnDate = new Date(),
  ipAddress,
}) {
  if (!bookCopyId) throw createError("bookCopyId is required", 400);
  if (!librarianId) throw createError("librarianId is required", 400);

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

    const activeTransaction = await tx.borrowingTransaction.findFirst({
      where: { bookCopyId, status: TransactionStatus.ACTIVE },
      orderBy: { checkoutDate: "desc" },
      select: { id: true, bookCopyId: true, dueDate: true },
    });

    if (!activeTransaction) {
      throw createError("No active borrowing transaction found for this copy", 409);
    }

    const returnUpdate = await tx.bookCopy.updateMany({
      where: { id: bookCopyId, status: BookCopyStatus.BORROWED },
      data: { status: BookCopyStatus.AVAILABLE },
    });

    if (returnUpdate.count !== 1) {
      throw createError("Book copy state conflict during return", 409);
    }

    const daysOverdue = calcDaysOverdue(returnDate, activeTransaction.dueDate);

    const transaction = await tx.borrowingTransaction.update({
      where: { id: activeTransaction.id },
      data: { returnDate, status: TransactionStatus.RETURNED, notes, daysOverdue },
      include: {
        borrower: { select: { id: true, fullName: true, email: true } },
        bookCopy: {
          select: {
            id: true, barcode: true,
            book: { select: { id: true, title: true, author: true } },
          },
        },
      },
    });

    const counts = await getBookCounts(transaction.bookCopy.book.id, tx);

    await auditLogger.log(tx, {
      actorId: librarian.id,
      action: "RETURN",
      targetType: "transaction",
      details: { transactionId: transaction.id, bookCopyId, returnDate: transaction.returnDate, daysOverdue },
      ipAddress,
    });

    return { transaction, inventory: { bookId: transaction.bookCopy.book.id, ...counts } };
  });
}

module.exports = { checkoutBook, returnBook };
