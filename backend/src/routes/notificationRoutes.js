const express = require("express");
const router = express.Router();
const {
  listNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require("../controllers/notificationController");
const { authenticateToken } = require("../middleware/authMiddleware");

// All notification routes require authentication
router.use(authenticateToken);

// GET /api/v1/notifications
router.get("/", listNotifications);

// PUT /api/v1/notifications/read-all (must be before :id route)
router.put("/read-all", markAllAsRead);

// PUT /api/v1/notifications/:id/read
router.put("/:id/read", markAsRead);

// DELETE /api/v1/notifications/:id
router.delete("/:id", deleteNotification);

module.exports = router;
