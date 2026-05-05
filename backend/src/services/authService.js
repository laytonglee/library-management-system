const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const prisma = require("../config/prisma");
const auditLogger = require("./auditLogger");
const { sendPasswordReset } = require("./emailService");

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

async function registerUser({ fullName, username, email, password, role = "student" }) {
  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    const error = new Error("Email already in use");
    error.statusCode = 409;
    throw error;
  }

  const existingUsername = await prisma.user.findUnique({ where: { username } });
  if (existingUsername) {
    const error = new Error("Username already taken");
    error.statusCode = 409;
    throw error;
  }

  const roleRecord = await prisma.role.findUnique({ where: { name: role } });
  if (!roleRecord) {
    const error = new Error(`Role '${role}' not found`);
    error.statusCode = 400;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { fullName, username, email, passwordHash, roleId: roleRecord.id },
    select: {
      id: true, fullName: true, username: true, email: true, isActive: true, createdAt: true,
      role: { select: { name: true } },
    },
  });

  return user;
}

async function loginUser(email, password, ipAddress = null) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: { select: { name: true } } },
  });

  if (!user) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error("Account is deactivated. Contact an administrator.");
    error.statusCode = 403;
    throw error;
  }

  // Check account lock
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const remaining = Math.ceil((user.lockedUntil - new Date()) / 60000);
    const error = new Error(`Account locked due to too many failed attempts. Try again in ${remaining} minute(s).`);
    error.statusCode = 429;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);

  if (!isMatch) {
    const newAttempts = user.failedAttempts + 1;
    const shouldLock = newAttempts >= MAX_FAILED_ATTEMPTS;

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          failedAttempts: newAttempts,
          lockedUntil: shouldLock ? new Date(Date.now() + LOCK_DURATION_MS) : null,
        },
      });

      await auditLogger.log(tx, {
        actorId: user.id,
        action: "LOGIN_FAILED",
        targetType: "user",
        targetId: user.id,
        details: { attempt: newAttempts, locked: shouldLock },
        ipAddress,
      });
    });

    const error = new Error(
      shouldLock
        ? `Too many failed attempts. Account locked for 15 minutes.`
        : "Invalid credentials"
    );
    error.statusCode = shouldLock ? 429 : 401;
    throw error;
  }

  // Successful login — reset counter and write audit log
  const { accessToken, refreshToken } = _signTokens(user);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { failedAttempts: 0, lockedUntil: null },
    });

    await auditLogger.log(tx, {
      actorId: user.id,
      action: "LOGIN",
      targetType: "user",
      targetId: user.id,
      details: { email: user.email, role: user.role.name },
      ipAddress,
    });
  });

  const { passwordHash, failedAttempts, lockedUntil, resetToken, resetTokenExpiry, ...safeUser } = user;
  return { accessToken, refreshToken, user: safeUser };
}

function _signTokens(user) {
  const payload = { userId: user.id, email: user.email, role: user.role.name };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    algorithm: "HS512",
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
  });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    algorithm: "HS512",
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });
  return { accessToken, refreshToken };
}

async function getUserById(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, fullName: true, username: true, email: true, isActive: true, createdAt: true,
      role: { select: { name: true } },
    },
  });
}

async function forgotPassword(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  // Always return success to avoid email enumeration
  if (!user || !user.isActive) return;

  const token = crypto.randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken: token, resetTokenExpiry: expiry },
  });

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

  await sendPasswordReset({ to: user.email, fullName: user.fullName, resetUrl });
}

async function resetPassword(token, newPassword) {
  const user = await prisma.user.findUnique({ where: { resetToken: token } });

  if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
    const error = new Error("Invalid or expired reset token");
    error.statusCode = 400;
    throw error;
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, resetToken: null, resetTokenExpiry: null, failedAttempts: 0, lockedUntil: null },
  });
}

module.exports = { registerUser, loginUser, getUserById, forgotPassword, resetPassword };
