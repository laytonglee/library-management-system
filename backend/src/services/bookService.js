const { BookCopyStatus, TransactionStatus } = require("@prisma/client");
const prisma = require("../config/prisma");
const {
  createError,
  withSerializableTransaction,
  getBookCounts,
} = require("../utils/db");
const auditLogger = require("./auditLogger");

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
  actorId,
  ipAddress,
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

    await auditLogger.log(tx, {
      actorId,
      action: "ADD_BOOK",
      targetType: "book",
      targetId: book.id,
      details: { title, author, isbn: isbn ?? null, totalCopies },
      ipAddress,
    });

    const counts = await getBookCounts(book.id, tx);
    return { ...book, ...counts };
  });
}

async function addBookCopy(
  bookId,
  { barcode, location, status, actorId, ipAddress } = {},
) {
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

    await auditLogger.log(tx, {
      actorId,
      action: "ADD_COPY",
      targetType: "book",
      targetId: bookId,
      details: {
        copyId: copy.id,
        barcode: barcode ?? null,
        location: location ?? null,
      },
      ipAddress,
    });

    const counts = await getBookCounts(bookId, tx);
    return { copy, ...counts };
  });
}

async function updateBookCopy(
  bookId,
  copyId,
  data = {},
  { actorId, ipAddress } = {},
) {
  return withSerializableTransaction(async (tx) => {
    const existing = await tx.bookCopy.findFirst({
      where: { id: copyId, bookId },
      select: { id: true, status: true },
    });

    if (!existing) {
      throw createError("Book copy not found", 404);
    }

    if (data.status && data.status !== existing.status) {
      const activeTx = await tx.borrowingTransaction.findFirst({
        where: {
          bookCopyId: copyId,
          status: TransactionStatus.ACTIVE,
        },
        select: { id: true },
      });

      if (activeTx) {
        throw createError(
          "Cannot change copy status while a borrowing transaction is ACTIVE — return the book first",
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

    await auditLogger.log(tx, {
      actorId,
      action: "EDIT_BOOK",
      targetType: "book",
      targetId: bookId,
      details: {
        copyId,
        before: { status: existing.status },
        after: {
          barcode: data.barcode ?? null,
          location: data.location ?? null,
          status: data.status ?? null,
        },
      },
      ipAddress,
    });

    const counts = await getBookCounts(bookId, tx);
    return { copy, ...counts };
  });
}

// ─── List / Search Books ─────────────────────────────────────────────────────

async function listBooks({
  search,
  categoryId,
  availability,
  page = 1,
  limit = 20,
} = {}) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const where = {};
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { author: { contains: search, mode: "insensitive" } },
      { isbn: { contains: search, mode: "insensitive" } },
    ];
  }
  if (categoryId) where.categoryId = parseInt(categoryId, 10);

  const [books, total] = await Promise.all([
    prisma.book.findMany({
      where,
      include: {
        category: true,
        copies: { select: { id: true, status: true } },
      },
      skip,
      take: limitNum,
      orderBy: { title: "asc" },
    }),
    prisma.book.count({ where }),
  ]);

  let data = books.map((book) => {
    const totalCopies = book.copies.length;
    const availableCopies = book.copies.filter(
      (c) => c.status === BookCopyStatus.AVAILABLE,
    ).length;
    const { copies, ...rest } = book;
    return { ...rest, totalCopies, availableCopies };
  });

  if (availability === "available")
    data = data.filter((b) => b.availableCopies > 0);
  else if (availability === "unavailable")
    data = data.filter((b) => b.availableCopies === 0);

  return {
    books: data,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  };
}

// ─── Get Single Book (with copies) ──────────────────────────────────────────

async function getBook(bookId) {
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    include: {
      category: true,
      copies: {
        select: { id: true, barcode: true, status: true, location: true },
      },
    },
  });
  if (!book) throw createError("Book not found", 404);
  const counts = await getBookCounts(bookId);
  return { ...book, ...counts };
}

// ─── Update Book ─────────────────────────────────────────────────────────────

async function updateBook(bookId, data) {
  const book = await prisma.book.update({
    where: { id: bookId },
    data: {
      title: data.title,
      author: data.author,
      isbn: data.isbn,
      categoryId: data.categoryId,
      publisher: data.publisher,
      publicationYear: data.publicationYear,
      description: data.description,
      coverImageUrl: data.coverImageUrl,
    },
    include: { category: true },
  });
  const counts = await getBookCounts(bookId);
  return { ...book, ...counts };
}

// ─── Delete Book ─────────────────────────────────────────────────────────────

async function deleteBook(bookId) {
  const activeCount = await prisma.borrowingTransaction.count({
    where: { bookCopy: { bookId }, status: "ACTIVE" },
  });
  if (activeCount > 0) {
    throw createError(
      "Cannot delete book with active borrowing transactions",
      409,
    );
  }
  await prisma.$transaction([
    prisma.bookCopy.deleteMany({ where: { bookId } }),
    prisma.book.delete({ where: { id: bookId } }),
  ]);
}

// ─── List Copies ─────────────────────────────────────────────────────────────

async function listCopies(bookId) {
  return prisma.bookCopy.findMany({
    where: { bookId },
    orderBy: { id: "asc" },
  });
}

// ─── Categories ───────────────────────────────────────────────────────────────

async function listCategories() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { books: true } } },
  });
}

async function createCategory({ name, description }) {
  if (!name) throw createError("name is required", 400);
  return prisma.category.create({ data: { name, description } });
}

async function updateCategory(id, { name, description }) {
  return prisma.category.update({
    where: { id },
    data: { name, description },
  });
}

async function deleteCategory(id) {
  await prisma.category.delete({ where: { id } });
}

module.exports = {
  addBookCopy,
  createBook,
  getBookById,
  updateBookCopy,
  listBooks,
  getBook,
  updateBook,
  deleteBook,
  listCopies,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
