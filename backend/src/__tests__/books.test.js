const request = require("supertest");

jest.mock("jsonwebtoken");
jest.mock("../services/bookService", () => ({
  listBooks: jest.fn(),
  getBook: jest.fn(),
  createBook: jest.fn(),
  updateBook: jest.fn(),
  deleteBook: jest.fn(),
  listCopies: jest.fn(),
  addBookCopy: jest.fn(),
  updateBookCopy: jest.fn(),
  listCategories: jest.fn(),
  createCategory: jest.fn(),
  updateCategory: jest.fn(),
  deleteCategory: jest.fn(),
}));

const jwt = require("jsonwebtoken");
const bookService = require("../services/bookService");
const app = require("../app");

function fakeUser(role = "librarian", userId = 42) {
  return { userId, role, username: `${role}-user` };
}

beforeEach(() => {
  jest.clearAllMocks();
  jwt.verify.mockReturnValue(fakeUser());
});

describe("Books API", () => {
  it("searches books via the service layer", async () => {
    bookService.listBooks.mockResolvedValue({
      books: [
        {
          id: 1,
          title: "Domain-Driven Design",
          author: "Eric Evans",
          isbn: "9780321125217",
          category: { id: 3, name: "Software" },
          totalCopies: 2,
          availableCopies: 1,
        },
      ],
      pagination: { page: 2, limit: 5, total: 1, totalPages: 1 },
    });

    const res = await request(app)
      .get("/api/v1/books?search=design&page=2&limit=5")
      .set("Cookie", "accessToken=fake");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data[0]).toEqual(
      expect.objectContaining({
        id: 1,
        totalCopies: 2,
        availableCopies: 1,
      }),
    );
    expect(bookService.listBooks).toHaveBeenCalledWith(
      expect.objectContaining({ search: "design", page: "2", limit: "5" }),
    );
  });

  it("gets a single book by id", async () => {
    bookService.getBook.mockResolvedValue({
      id: 12,
      title: "Clean Code",
      totalCopies: 4,
      availableCopies: 3,
    });

    const res = await request(app)
      .get("/api/v1/books/12")
      .set("Cookie", "accessToken=fake");

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(12);
    expect(bookService.getBook).toHaveBeenCalledWith(12);
  });

  it("lists categories for authenticated users", async () => {
    bookService.listCategories.mockResolvedValue([
      { id: 1, name: "History" },
      { id: 2, name: "Science" },
    ]);

    const res = await request(app)
      .get("/api/v1/books/categories")
      .set("Cookie", "accessToken=fake");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
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

  it("updates a book via the service layer", async () => {
    bookService.updateBook.mockResolvedValue({
      id: 9,
      title: "Updated Book",
      author: "Author Name",
    });

    const res = await request(app)
      .put("/api/v1/books/9")
      .set("Cookie", "accessToken=fake")
      .send({ title: "Updated Book", author: "Author Name" });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(
      expect.objectContaining({
        id: 9,
        title: "Updated Book",
      }),
    );
    expect(bookService.updateBook).toHaveBeenCalledWith(9, expect.objectContaining({ title: "Updated Book" }));
  });

  it("lists physical copies for a book", async () => {
    bookService.listCopies.mockResolvedValue([
      { id: 1, bookId: 4, status: "AVAILABLE" },
      { id: 2, bookId: 4, status: "BORROWED" },
    ]);

    const res = await request(app)
      .get("/api/v1/books/4/copies")
      .set("Cookie", "accessToken=fake");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
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
