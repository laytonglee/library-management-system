const { registerUser, loginUser } = require("../services/authService");

/**
 * POST /api/auth/register
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

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters",
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

  try {
    const user = await registerUser({
      fullName: full_name,
      username,
      email,
      password,
      role: role || "student",
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
 * POST /api/auth/login
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

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: { accessToken, refreshToken, user },
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Internal server error",
    });
  }
}

module.exports = { register, login };
