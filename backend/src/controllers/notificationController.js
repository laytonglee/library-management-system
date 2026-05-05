const notificationService = require("../services/notificationService");

async function listNotifications(req, res) {
  try {
    const result = await notificationService.listNotifications(
      req.user.userId,
      req.query,
    );
    return res.json({
      success: true,
      data: result.notifications,
      unreadCount: result.unreadCount,
      pagination: result.pagination,
    });
  } catch (err) {
    return res
      .status(err.statusCode || 500)
      .json({
        success: false,
        message: err.message || "Internal server error",
      });
  }
}

async function markAsRead(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid notification ID" });
    const updated = await notificationService.markAsRead(id, req.user.userId);
    return res.json({ success: true, data: updated });
  } catch (err) {
    return res
      .status(err.statusCode || 500)
      .json({
        success: false,
        message: err.message || "Internal server error",
      });
  }
}

async function markAllAsRead(req, res) {
  try {
    await notificationService.markAllAsRead(req.user.userId);
    return res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (err) {
    return res
      .status(err.statusCode || 500)
      .json({
        success: false,
        message: err.message || "Internal server error",
      });
  }
}

async function deleteNotification(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid notification ID" });
    await notificationService.deleteNotification(id, req.user.userId);
    return res.json({ success: true, message: "Notification deleted" });
  } catch (err) {
    return res
      .status(err.statusCode || 500)
      .json({
        success: false,
        message: err.message || "Internal server error",
      });
  }
}

module.exports = {
  listNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
