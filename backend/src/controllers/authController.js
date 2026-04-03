const {
  registerUser,
  loginUser,
  getUserById,
} = require("../services/authService");
const jwt = require("jsonwebtoken");

function getTokenMaxAge(token) {
  const decoded = jwt.decode(token);
  if (!decoded || !decoded.exp) {
    return undefined;
  }

  const maxAge = decoded.exp * 1000 - Date.now();
  return maxAge > 0 ? maxAge : undefined;
}

function buildCookieOptions(maxAge) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.COOKIE_SAME_SITE || "lax",
    path: "/",
    ...(maxAge ? { maxAge } : {}),
  };
}

/**
 * POST /api/v1/auth/register       — self-registration (student | teacher only)
 * POST /api/v1/auth/register/admin — create any role (admin only, guarded by middleware)
 */
async function register(req, res) {
  const { full_name, username, email, password, role } = req.body;

  // Basic validation
  if (!full_name || !username || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "full_name, username, email, and password are required",
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters",
    });
  }

  // Simple email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: "Invalid email format",
    });
  }

  // Self-registration is limited to student/teacher.
  // The admin-only route (/register/admin) skips this check because
  // req.user is set by authenticateToken — meaning an admin is calling.
  const SELF_REG_ROLES = ["student", "teacher"];
  const requestedRole = role || "student";
  const isAdminRoute = !!req.user;

  if (!isAdminRoute && !SELF_REG_ROLES.includes(requestedRole)) {
    return res.status(403).json({
      success: false,
      message: `Self-registration is only allowed for: ${SELF_REG_ROLES.join(", ")}`,
    });
  }

  try {
    const user = await registerUser({
      fullName: full_name,
      username,
      email,
      password,
      role: requestedRole,
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      data: { user },
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Internal server error",
    });
  }
}

/**
 * POST /api/v1/auth/login
 */
async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  try {
    const { accessToken, refreshToken, user } = await loginUser(
      email,
      password,
    );

    res.cookie(
      "accessToken",
      accessToken,
      buildCookieOptions(getTokenMaxAge(accessToken)),
    );
    res.cookie(
      "refreshToken",
      refreshToken,
      buildCookieOptions(getTokenMaxAge(refreshToken)),
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: { user },
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Internal server error",
    });
  }
}

/**
 * POST /api/v1/auth/logout
 */
async function logout(req, res) {
  const clearCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.COOKIE_SAME_SITE || "lax",
    path: "/",
  };

  res.clearCookie("accessToken", clearCookieOptions);
  res.clearCookie("refreshToken", clearCookieOptions);

  return res.status(200).json({
    success: true,
    message: "Logout successful",
  });
}

/**
 * GET /api/v1/auth/me
 */
async function getMe(req, res) {
  try {
    const user = await getUserById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Internal server error",
    });
  }
}

/**
 * POST /api/v1/auth/refresh
 * Reads the refreshToken cookie, verifies it, and issues a new accessToken.
 */
async function refresh(req, res) {
  const token = req.cookies?.refreshToken;

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "No refresh token provided" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { algorithms: ["HS512"] },
    );

    // Make sure the user still exists and is active
    const user = await getUserById(decoded.userId);
    if (!user || !user.isActive) {
      return res
        .status(401)
        .json({ success: false, message: "User not found or deactivated" });
    }

    const accessToken = require("jsonwebtoken").sign(
      { userId: user.id, email: user.email, role: user.role.name },
      process.env.JWT_SECRET,
      { algorithm: "HS512", expiresIn: process.env.JWT_EXPIRES_IN || "15m" },
    );

    res.cookie(
      "accessToken",
      accessToken,
      buildCookieOptions(getTokenMaxAge(accessToken)),
    );

    return res.status(200).json({ success: true, message: "Token refreshed" });
  } catch {
    // Refresh token is invalid or expired — force re-login
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    return res.status(401).json({
      success: false,
      message: "Refresh token expired, please log in again",
    });
  }
}

module.exports = { register, login, logout, getMe, refresh };
