// backend/src/__tests__/transactions.test.js
const request = require("supertest");
const app = require("../app");

// Mock bookService so tests don't need a real DB
jest.mock("../services/bookService");
const bookService = require("../services/bookService");

// Mock JWT verification so we can forge tokens
jest.mock("jsonwebtoken");
const jwt = require("jsonwebtoken");

// Helper: build a fake decoded token for a given role
function fakeUser(role = "librarian") {
  return { userId: 42, role, username: "testlib" };
}

// Make jwt.verify return our fake user by default
beforeEach(() => {
  jest.clearAllMocks();
  jwt.verify.mockReturnValue(fakeUser("librarian"));
});

// ── Checkout ────────────────────────────────────────────────────────────────

describe("POST /api/transactions/checkout", () => {
  const validBody = { borrowerId: 1, bookCopyId: 10 };

  const mockResult = {
    transaction: {
      id: 99,
      checkoutDate: new Date().toISOString(),
      dueDate: new Date().toISOString(),
      status: "ACTIVE",
      borrower: { id: 1, fullName: "Alice", email: "alice@test.com" },
      bookCopy: {
        id: 10,
        barcode: "BC001",
        book: { id: 5, title: "Test Book", author: "Author" },
      },
    },
    inventory: { bookId: 5, totalCopies: 3, availableCopies: 2 },
  };

  it("returns 401 when no token provided", async () => {
    jwt.verify.mockImplementation(() => { throw new Error("no token"); });
    const res = await request(app).post("/api/transactions/checkout").send(validBody);
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("returns 403 when caller is a student", async () => {
    jwt.verify.mockReturnValue(fakeUser("student"));
    const res = await request(app)
      .post("/api/transactions/checkout")
      .set("Cookie", "accessToken=fake")
      .send(validBody);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it("returns 400 when bookCopyId is missing", async () => {
    const res = await request(app)
      .post("/api/transactions/checkout")
      .set("Cookie", "accessToken=fake")
      .send({ borrowerId: 1 });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("returns 400 when borrowerId is missing", async () => {
    const res = await request(app)
      .post("/api/transactions/checkout")
      .set("Cookie", "accessToken=fake")
      .send({ bookCopyId: 10 });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("returns 201 with transaction data on success", async () => {
    bookService.checkoutBook.mockResolvedValue(mockResult);
    const res = await request(app)
      .post("/api/transactions/checkout")
      .set("Cookie", "accessToken=fake")
      .send(validBody);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.transaction.id).toBe(99);
    expect(bookService.checkoutBook).toHaveBeenCalledWith(
      expect.objectContaining({ borrowerId: 1, bookCopyId: 10, librarianId: 42 })
    );
  });

  it("forwards service errors with their status code", async () => {
    const err = new Error("Book copy is not available for checkout");
    err.statusCode = 409;
    bookService.checkoutBook.mockRejectedValue(err);
    const res = await request(app)
      .post("/api/transactions/checkout")
      .set("Cookie", "accessToken=fake")
      .send(validBody);
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });
});

// ── Return ───────────────────────────────────────────────────────────────────

describe("POST /api/transactions/return", () => {
  const validBody = { bookCopyId: 10 };

  const mockResult = {
    transaction: {
      id: 99,
      returnDate: new Date().toISOString(),
      status: "RETURNED",
      borrower: { id: 1, fullName: "Alice", email: "alice@test.com" },
      bookCopy: {
        id: 10,
        barcode: "BC001",
        book: { id: 5, title: "Test Book", author: "Author" },
      },
    },
    inventory: { bookId: 5, totalCopies: 3, availableCopies: 3 },
  };

  it("returns 401 when no token provided", async () => {
    jwt.verify.mockImplementation(() => { throw new Error("no token"); });
    const res = await request(app).post("/api/transactions/return").send(validBody);
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("returns 403 when caller is a teacher", async () => {
    jwt.verify.mockReturnValue(fakeUser("teacher"));
    const res = await request(app)
      .post("/api/transactions/return")
      .set("Cookie", "accessToken=fake")
      .send(validBody);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it("returns 400 when bookCopyId is missing", async () => {
    const res = await request(app)
      .post("/api/transactions/return")
      .set("Cookie", "accessToken=fake")
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("returns 200 with transaction data on success", async () => {
    bookService.returnBook.mockResolvedValue(mockResult);
    const res = await request(app)
      .post("/api/transactions/return")
      .set("Cookie", "accessToken=fake")
      .send(validBody);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.transaction.id).toBe(99);
    expect(bookService.returnBook).toHaveBeenCalledWith(
      expect.objectContaining({ bookCopyId: 10 })
    );
  });

  it("forwards service errors with their status code", async () => {
    const err = new Error("No active borrowing transaction found for this copy");
    err.statusCode = 409;
    bookService.returnBook.mockRejectedValue(err);
    const res = await request(app)
      .post("/api/transactions/return")
      .set("Cookie", "accessToken=fake")
      .send(validBody);
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });
});
