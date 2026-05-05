function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

describe("Service transaction and audit contracts", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("book creation uses a serializable transaction and writes an ADD_BOOK audit log", async () => {
    const tx = {
      book: {
        create: jest.fn().mockResolvedValue({ id: 10, title: "New Book", author: "Author" }),
      },
      bookCopy: {
        createMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
    };
    const withSerializableTransaction = jest.fn(async (work) => work(tx));
    const getBookCounts = jest.fn().mockResolvedValue({ totalCopies: 2, availableCopies: 2 });
    const log = jest.fn().mockResolvedValue({});

    jest.doMock("../config/prisma", () => ({}));
    jest.doMock("../utils/db", () => ({
      createError,
      withSerializableTransaction,
      getBookCounts,
    }));
    jest.doMock("../services/auditLogger", () => ({ log }));

    const { createBook } = require("../services/bookService");

    const result = await createBook({
      title: "New Book",
      author: "Author",
      totalCopies: 2,
      actorId: 42,
      ipAddress: "127.0.0.1",
    });

    expect(withSerializableTransaction).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        actorId: 42,
        action: "ADD_BOOK",
        targetType: "book",
        targetId: 10,
      }),
    );
    expect(result).toEqual(expect.objectContaining({ id: 10, totalCopies: 2, availableCopies: 2 }));
  });

  it("user creation hashes the password and checks for duplicates", async () => {
    const hash = jest.fn().mockResolvedValue("$2b$hashed");
    const mockPrisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          id: 15,
          fullName: "Admin Created",
          username: "created-user",
          email: "created@example.com",
          isActive: true,
          createdAt: new Date(),
          role: { id: 3, name: "librarian" },
        }),
      },
    };

    jest.doMock("bcryptjs", () => ({ hash }));
    jest.doMock("../config/prisma", () => mockPrisma);
    jest.doMock("../utils/db", () => ({ createError }));

    const { createUser } = require("../services/userService");

    const result = await createUser({
      fullName: "Admin Created",
      username: "created-user",
      email: "created@example.com",
      password: "Secret123!",
      roleId: 3,
    });

    expect(hash).toHaveBeenCalledWith("Secret123!", 10);
    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          fullName: "Admin Created",
          username: "created-user",
          passwordHash: "$2b$hashed",
          roleId: 3,
        }),
      }),
    );
    expect(result.id).toBe(15);
  });

  it("checkout uses a serializable transaction and writes a CHECKOUT audit log", async () => {
    const dueDate = new Date("2026-04-14T00:00:00.000Z");
    const tx = {
      user: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce({ id: 7, isActive: true })
          .mockResolvedValueOnce({ id: 9, isActive: true, roleId: 2 }),
      },
      borrowingPolicy: {
        findUnique: jest.fn().mockResolvedValue({ loanDurationDays: 14, maxBooksAllowed: 3 }),
      },
      borrowingTransaction: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockResolvedValue({
          id: 31,
          dueDate,
          borrower: { id: 9, fullName: "Borrower", email: "borrower@example.com" },
          bookCopy: { id: 5, barcode: "BC-5", book: { id: 2, title: "Book", author: "Author" } },
        }),
      },
      bookCopy: {
        findUnique: jest.fn().mockResolvedValue({ id: 5, bookId: 2, status: "AVAILABLE" }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const withSerializableTransaction = jest.fn(async (work) => work(tx));
    const getBookCounts = jest.fn().mockResolvedValue({ totalCopies: 3, availableCopies: 2 });
    const log = jest.fn().mockResolvedValue({});

    jest.doMock("../utils/db", () => ({
      createError,
      withSerializableTransaction,
      getBookCounts,
    }));
    jest.doMock("../services/auditLogger", () => ({ log }));

    const { checkoutBook } = require("../services/checkoutService");

    await checkoutBook({
      borrowerId: 9,
      librarianId: 7,
      bookCopyId: 5,
      checkoutDate: new Date("2026-03-31T00:00:00.000Z"),
      ipAddress: "127.0.0.1",
    });

    expect(withSerializableTransaction).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        actorId: 7,
        action: "CHECKOUT",
        targetType: "transaction",
        targetId: 31,
      }),
    );
  });

  // TC-06-10: detectAndFlagOverdue uses $transaction, creates notification, writes OVERDUE_FLAG audit log
  it("overdue check marks active past-due transactions as OVERDUE, creates OVERDUE_ALERT notification, and writes OVERDUE_FLAG audit log in one transaction", async () => {
    const dueDate = new Date("2026-03-20T00:00:00.000Z");
    const tx = {
      borrowingTransaction: { update: jest.fn().mockResolvedValue({}) },
      notification: { create: jest.fn().mockResolvedValue({}) },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
    };
    const mockPrisma = {
      borrowingTransaction: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 99,
            borrowerId: 4,
            dueDate,
            borrower: { id: 4, fullName: "Borrower" },
            bookCopy: { book: { title: "Overdue Book" } },
          },
        ]),
      },
      $transaction: jest.fn(async (work) => work(tx)),
    };
    const log = jest.fn().mockResolvedValue({});

    jest.doMock("../config/prisma", () => mockPrisma);
    jest.doMock("@prisma/client", () => ({
      TransactionStatus: { ACTIVE: "ACTIVE", OVERDUE: "OVERDUE" },
      NotificationType: { OVERDUE_ALERT: "OVERDUE_ALERT" },
    }));
    jest.doMock("../services/auditLogger", () => ({ log }));

    const { runOverdueCheck } = require("../services/overdueService");

    const result = await runOverdueCheck();

    expect(result.overdueCount).toBe(1);
    expect(result.newNotifications).toBe(1);

    // Status updated inside $transaction
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.borrowingTransaction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 99 },
        data: { status: "OVERDUE" },
      }),
    );

    // OVERDUE_ALERT notification created for the borrower (TC-06-03)
    expect(tx.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 4,
          transactionId: 99,
          type: "OVERDUE_ALERT",
        }),
      }),
    );

    // OVERDUE_FLAG audit log written in same $transaction (TC-06-10)
    expect(log).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        actorId: null,
        action: "OVERDUE_FLAG",
        targetType: "transaction",
        targetId: 99,
      }),
    );
  });

  it("detectAndFlagOverdue does not re-flag already-OVERDUE transactions (duplicate prevention)", async () => {
    const mockPrisma = {
      borrowingTransaction: {
        // Returns empty — all past-due transactions are now OVERDUE, not ACTIVE
        findMany: jest.fn().mockResolvedValue([]),
      },
      $transaction: jest.fn(),
    };

    jest.doMock("../config/prisma", () => mockPrisma);
    jest.doMock("@prisma/client", () => ({
      TransactionStatus: { ACTIVE: "ACTIVE", OVERDUE: "OVERDUE" },
      NotificationType: { OVERDUE_ALERT: "OVERDUE_ALERT" },
    }));
    jest.doMock("../services/auditLogger", () => ({ log: jest.fn() }));

    const { runOverdueCheck } = require("../services/overdueService");

    const result = await runOverdueCheck();

    expect(result.overdueCount).toBe(0);
    expect(result.newNotifications).toBe(0);
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    expect(mockPrisma.borrowingTransaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "ACTIVE" }),
      }),
    );
  });
});
