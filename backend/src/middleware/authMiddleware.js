const jwt = require("jsonwebtoken");
const { hasPermission } = require("../config/permissions");

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies?.accessToken;
  let accessToken = cookieToken;

  if (!accessToken && authHeader && authHeader.startsWith("Bearer ")) {
    accessToken = authHeader.split(" ")[1];
  }

  if (!accessToken) {
    return res.status(401).json({
      success: false,
      message: "Access token is required",
    });
  }

  try {
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET, {
      algorithms: ["HS512"],
    });

    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired access token",
    });
  }
}

/**
 * Middleware that restricts access to users whose role is in the provided list.
 * Must be used AFTER authenticateToken so that req.user is set.
 *
 * Usage:  router.get("/admin", authenticateToken, authorizeRoles("admin"), handler)
 */
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this resource",
      });
    }
    return next();
  };
}

/**
 * Middleware that restricts access based on a specific permission key.
 * Must be used AFTER authenticateToken so that req.user is set.
 *
 * Usage:  router.get("/catalog", authenticateToken, requirePermission("manage_catalog"), handler)
 */
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user || !hasPermission(req.user.role, permission)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
    }
    return next();
  };
}

module.exports = { authenticateToken, authorizeRoles, requirePermission };
