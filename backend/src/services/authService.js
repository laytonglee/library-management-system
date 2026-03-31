const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

/**
 * Register a new user
 * @param {Object} data - { fullName, username, email, password, role }
 * @returns {Object} - created user (without passwordHash)
 */
async function registerUser({
  fullName,
  username,
  email,
  password,
  role = "student",
}) {
  // 1. Check if email already exists
  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    const error = new Error("Email already in use");
    error.statusCode = 409;
    throw error;
  }

  // 2. Check if username already exists
  const existingUsername = await prisma.user.findUnique({
    where: { username },
  });
  if (existingUsername) {
    const error = new Error("Username already taken");
    error.statusCode = 409;
    throw error;
  }

  // 3. Find the role record
  const roleRecord = await prisma.role.findUnique({ where: { name: role } });
  if (!roleRecord) {
    const error = new Error(`Role '${role}' not found`);
    error.statusCode = 400;
    throw error;
  }

  // 4. Hash password
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // 5. Create user
  const user = await prisma.user.create({
    data: {
      fullName,
      username,
      email,
      passwordHash,
      roleId: roleRecord.id,
    },
    select: {
      id: true,
      fullName: true,
      username: true,
      email: true,
      isActive: true,
      createdAt: true,
      role: {
        select: { name: true },
      },
    },
  });

  return user;
}

/**
 * Login a user
 * @param {string} email
 * @param {string} password
 * @returns {{ token: string, user: Object }}
 */
async function loginUser(email, password) {
  // 1. Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: { select: { name: true } } },
  });

  if (!user) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  // 2. Check if account is active
  if (!user.isActive) {
    const error = new Error(
      "Account is deactivated. Contact an administrator.",
    );
    error.statusCode = 403;
    throw error;
  }

  // 3. Compare password
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  // 4. Sign JWT
  const accessToken = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role.name,
    },
    process.env.JWT_SECRET,
    { algorithm: "HS512", expiresIn: process.env.JWT_EXPIRES_IN },
  );

  const refreshToken = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role.name,
    },
    process.env.JWT_SECRET,
    { algorithm: "HS512", expiresIn: process.env.JWT_REFRESH_EXPIRES_IN },
  );

  // 5. Return token + safe user object
  const { passwordHash, ...safeUser } = user;
  return { accessToken, refreshToken, user: safeUser };
}

/**
 * Get user by ID (safe fields only)
 * @param {string} userId
 * @returns {Object} user without passwordHash
 */
async function getUserById(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      username: true,
      email: true,
      isActive: true,
      createdAt: true,
      role: {
        select: { name: true },
      },
    },
  });

  return user;
}

module.exports = { registerUser, loginUser, getUserById };
