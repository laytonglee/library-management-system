// backend/src/services/userService.js
const prisma = require("../config/prisma");
const bcrypt = require("bcryptjs");
const { createError } = require("../utils/db");

const USER_SELECT = {
  id: true,
  fullName: true,
  username: true,
  email: true,
  isActive: true,
  createdAt: true,
  role: { select: { id: true, name: true } },
};

// ─── Users ────────────────────────────────────────────────────────────────────

async function listUsers({
  search,
  role,
  isActive,
  page = 1,
  limit = 20,
} = {}) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const where = {};
  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { username: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }
  if (role) where.role = { name: role };
  if (isActive !== undefined)
    where.isActive = isActive === "true" || isActive === true;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: USER_SELECT,
      skip,
      take: limitNum,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  };
}

async function getUserById(id) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { ...USER_SELECT, updatedAt: true },
  });
  if (!user) throw createError("User not found", 404);
  return user;
}

async function createUser({ fullName, username, email, password, roleId }) {
  if (!fullName || !username || !email || !password) {
    throw createError(
      "fullName, username, email, and password are required",
      400,
    );
  }
  if (password.length < 8)
    throw createError("Password must be at least 8 characters", 400);

  const [existingEmail, existingUsername] = await Promise.all([
    prisma.user.findUnique({ where: { email } }),
    prisma.user.findUnique({ where: { username } }),
  ]);
  if (existingEmail) throw createError("Email already in use", 409);
  if (existingUsername) throw createError("Username already taken", 409);

  const passwordHash = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: { fullName, username, email, passwordHash, roleId: roleId || 1 },
    select: USER_SELECT,
  });
}

async function updateUser(id, { fullName, username, email, roleId, isActive }) {
  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(fullName !== undefined && { fullName }),
      ...(username !== undefined && { username }),
      ...(email !== undefined && { email }),
      ...(roleId !== undefined && { roleId }),
      ...(isActive !== undefined && { isActive }),
    },
    select: USER_SELECT,
  });
  return user;
}

async function deactivateUser(id) {
  return prisma.user.update({
    where: { id },
    data: { isActive: false },
    select: {
      id: true,
      fullName: true,
      isActive: true,
      role: { select: { name: true } },
    },
  });
}

async function deleteUser(id) {
  const activeCount = await prisma.borrowingTransaction.count({
    where: { borrowerId: id, status: "ACTIVE" },
  });
  if (activeCount > 0) {
    throw createError(
      "Cannot delete user with active borrowing transactions",
      409,
    );
  }
  await prisma.user.delete({ where: { id } });
}

async function getUserBorrowingHistory(
  id,
  { page = 1, limit = 20, status } = {},
) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const where = { borrowerId: id };
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

// ─── Roles ────────────────────────────────────────────────────────────────────

async function listRoles() {
  return prisma.role.findMany({
    orderBy: { id: "asc" },
    include: { _count: { select: { users: true } } },
  });
}

// ─── Borrowing Policies ──────────────────────────────────────────────────────

async function listBorrowingPolicies() {
  return prisma.borrowingPolicy.findMany({
    include: { role: { select: { name: true } } },
    orderBy: { roleId: "asc" },
  });
}

async function updateBorrowingPolicy(
  roleId,
  { loanDurationDays, maxBooksAllowed },
) {
  return prisma.borrowingPolicy.upsert({
    where: { roleId },
    update: {
      ...(loanDurationDays !== undefined && { loanDurationDays }),
      ...(maxBooksAllowed !== undefined && { maxBooksAllowed }),
    },
    create: {
      roleId,
      loanDurationDays: loanDurationDays || 14,
      maxBooksAllowed: maxBooksAllowed || 3,
    },
    include: { role: { select: { name: true } } },
  });
}

module.exports = {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deactivateUser,
  deleteUser,
  getUserBorrowingHistory,
  listRoles,
  listBorrowingPolicies,
  updateBorrowingPolicy,
};
