const request = require("supertest");

jest.mock("jsonwebtoken");
jest.mock("../config/prisma", () => ({
  book: {
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  bookCopy: {
    findMany: jest.fn(),
  },
  category: {
    findMany: jest.fn(),
  },
}));
jest.mock("../services/bookService", () => ({
  getBookById: jest.fn(),
  createBook: jest.fn(),
  addBookCopy: jest.fn(),
  updateBookCopy: jest.fn(),
}));
jest.mock("../utils/db", () => ({
  createError: (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
  },
  withSerializableTransaction: jest.fn(),
  getBookCounts: jest.fn(),
}));

const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const bookService = require("../services/bookService");
const { getBookCounts } = require("../utils/db");
const app = require("../app");

function fakeUser(role = "librarian", userId = 42) {
  return { userId, role, username: `${role}-user` };
}

beforeEach(() => {
  jest.clearAllMocks();
  jwt.verify.mockReturnValue(fakeUser());
});

describe("Books API", () => {
  it("searches books and returns computed copy counts", async () => {
    prisma.book.findMany.mockResolvedValue([
      {
        id: 1,
        title: "Domain-Driven Design",
        author: "Eric Evans",
        isbn: "9780321125217",
        category: { id: 3, name: "Software" },
        copies: [
          { id: 10, status: "AVAILABLE" },
          { id: 11, status: "BORROWED" },
        ],
      },
    ]);
    prisma.book.count.mockResolvedValue(1);

    const res = await request(app)
      .get("/api/v1/books?q=design&page=2&limit=5")
      .set("Cookie", "accessToken=fake");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.books[0]).toEqual(
      expect.objectContaining({
        id: 1,
        totalCopies: 2,
        availableCopies: 1,
      }),
    );
    expect(prisma.book.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { title: { contains: "design", mode: "insensitive" } },
            { author: { contains: "design", mode: "insensitive" } },
            { isbn: { contains: "design", mode: "insensitive" } },
          ]),
        }),
        skip: 5,
        take: 5,
      }),
    );
  });

  it("gets a single book by id", async () => {
    bookService.getBookById.mockResolvedValue({
      id: 12,
      title: "Clean Code",
      totalCopies: 4,
      availableCopies: 3,
    });

    const res = await request(app)
      .get("/api/v1/books/12")
      .set("Cookie", "accessToken=fake");

    expect(res.status).toBe(200);
    expect(res.body.data.book.id).toBe(12);
    expect(bookService.getBookById).toHaveBeenCalledWith(12);
  });

  it("lists categories for authenticated users", async () => {
    prisma.category.findMany.mockResolvedValue([
      { id: 1, name: "History" },
      { id: 2, name: "Science" },
    ]);

    const res = await request(app)
      .get("/api/v1/books/categories")
      .set("Cookie", "accessToken=fake");

    expect(res.status).toBe(200);
    expect(res.body.data.categories).toHaveLength(2);
  });

  it("creates a book for librarians and includes the authenticated actor id", async () => {
    bookService.createBook.mockResolvedValue({
      id: 55,
      title: "Refactoring",
      totalCopies: 2,
      availableCopies: 2,
    });

    const res = await request(app)
      .post("/api/v1/books")
      .set("Cookie", "accessToken=fake")
      .send({ title: "Refactoring", author: "Martin Fowler", totalCopies: 2 });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(bookService.createBook).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Refactoring",
        author: "Martin Fowler",
        totalCopies: 2,
        actorId: 42,
      }),
    );
  });

  it("blocks book creation for users without catalog permissions", async () => {
    jwt.verify.mockReturnValue(fakeUser("student"));

    const res = await request(app)
      .post("/api/v1/books")
      .set("Cookie", "accessToken=fake")
      .send({ title: "Unauthorized", author: "Student" });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(bookService.createBook).not.toHaveBeenCalled();
  });

  it("updates a book and returns refreshed copy counts", async () => {
    prisma.book.findUnique.mockResolvedValue({ id: 9 });
    prisma.book.update.mockResolvedValue({
      id: 9,
      title: "Updated Book",
      author: "Author Name",
      category: { id: 5, name: "Fiction" },
    });
    getBookCounts.mockResolvedValue({ totalCopies: 7, availableCopies: 6 });

    const res = await request(app)
      .put("/api/v1/books/9")
      .set("Cookie", "accessToken=fake")
      .send({ title: "Updated Book", author: "Author Name" });

    expect(res.status).toBe(200);
    expect(res.body.data.book).toEqual(
      expect.objectContaining({
        id: 9,
        title: "Updated Book",
        totalCopies: 7,
        availableCopies: 6,
      }),
    );
  });

  it("lists physical copies for a book", async () => {
    prisma.bookCopy.findMany.mockResolvedValue([
      { id: 1, bookId: 4, status: "AVAILABLE" },
      { id: 2, bookId: 4, status: "BORROWED" },
    ]);

    const res = await request(app)
      .get("/api/v1/books/4/copies")
      .set("Cookie", "accessToken=fake");

    expect(res.status).toBe(200);
    expect(res.body.data.copies).toHaveLength(2);
  });

  it("adds a copy and forwards the actor id", async () => {
    bookService.addBookCopy.mockResolvedValue({
      copy: { id: 88, bookId: 4, status: "AVAILABLE" },
      totalCopies: 3,
      availableCopies: 3,
    });

    const res = await request(app)
      .post("/api/v1/books/4/copies")
      .set("Cookie", "accessToken=fake")
      .send({ barcode: "BC-123", location: "A-01" });

    expect(res.status).toBe(201);
    expect(res.body.data.copy.id).toBe(88);
    expect(bookService.addBookCopy).toHaveBeenCalledWith(
      4,
      expect.objectContaining({
        barcode: "BC-123",
        location: "A-01",
        actorId: 42,
      }),
    );
  });

  it("updates a copy and forwards service conflicts", async () => {
    const error = new Error("Cannot change copy status while a borrowing transaction is ACTIVE");
    error.statusCode = 409;
    bookService.updateBookCopy.mockRejectedValue(error);

    const res = await request(app)
      .put("/api/v1/books/4/copies/10")
      .set("Cookie", "accessToken=fake")
      .send({ status: "LOST" });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });
});
