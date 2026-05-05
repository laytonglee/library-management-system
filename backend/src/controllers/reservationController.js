// backend/src/controllers/reservationController.js
const reservationService = require("../services/reservationService");

async function create(req, res, next) {
  try {
    const reservation = await reservationService.createReservation({
      userId: req.user.id,
      bookId: Number(req.body.bookId),
      ipAddress: req.ip,
    });
    res.status(201).json({ status: "success", data: reservation });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const result = await reservationService.listReservations({
      userId: req.user.id,
      role: req.user.role,
      status: req.query.status || undefined,
      bookId: req.query.bookId || undefined,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
    });
    res.json({
      status: "success",
      data: result.reservations,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
}

async function cancel(req, res, next) {
  try {
    const reservation = await reservationService.cancelReservation({
      reservationId: Number(req.params.id),
      userId: req.user.id,
      role: req.user.role,
      ipAddress: req.ip,
    });
    res.json({ status: "success", data: reservation });
  } catch (err) {
    next(err);
  }
}

async function fulfill(req, res, next) {
  try {
    const reservation = await reservationService.fulfillReservation({
      reservationId: Number(req.params.id),
      librarianId: req.user.id,
      bookCopyId: Number(req.body.bookCopyId),
      ipAddress: req.ip,
    });
    res.json({ status: "success", data: reservation });
  } catch (err) {
    next(err);
  }
}

async function queuePosition(req, res, next) {
  try {
    const result = await reservationService.getQueuePosition(
      req.user.id,
      Number(req.params.bookId),
    );
    res.json({ status: "success", data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, cancel, fulfill, queuePosition };
