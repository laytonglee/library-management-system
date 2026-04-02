import api from "./api";

// POST /reservations — create a reservation
export const createReservation = (bookId) =>
  api.post("/reservations", { bookId });

// GET /reservations — list reservations (own or all for staff)
export const getReservations = (params) => api.get("/reservations", { params });

// GET /reservations/queue/:bookId — get queue position
export const getQueuePosition = (bookId) =>
  api.get(`/reservations/queue/${bookId}`);

// PUT /reservations/:id/cancel
export const cancelReservation = (id) => api.put(`/reservations/${id}/cancel`);

// PUT /reservations/:id/fulfill
export const fulfillReservation = (id, bookCopyId) =>
  api.put(`/reservations/${id}/fulfill`, { bookCopyId });
