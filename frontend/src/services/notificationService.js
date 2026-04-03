import api from "./api";

// GET /notifications — current user's notifications
export const getNotifications = (params) =>
  api.get("/notifications", { params });

// PUT /notifications/:id/read — mark one as read
export const markAsRead = (id) => api.put(`/notifications/${id}/read`);

// PUT /notifications/read-all — mark all as read
export const markAllAsRead = () => api.put("/notifications/read-all");

// DELETE /notifications/:id — delete a notification
export const deleteNotification = (id) => api.delete(`/notifications/${id}`);
