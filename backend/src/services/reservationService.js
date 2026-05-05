// backend/src/services/reservationService.js
const { ReservationStatus, BookCopyStatus } = require("@prisma/client");
const prisma = require("../config/prisma");
const { createError } = require("../utils/db");
const auditLogger = require("./auditLogger");

/** Default reservation expiry: 3 days after notification */
const RESERVATION_EXPIRY_DAYS = 3;

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Create a reservation – any authenticated user can reserve a book when
 * no copies are available.
 */
async function createReservation({ userId, bookId, ipAddress }) {
  if (!userId || !bookId) {
    throw createError("userId and bookId are required", 400);
  }

  // Book must exist
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    select: { id: true, title: true },
  });
  if (!book) throw createError("Book not found", 404);

  // Check if there are available copies – reservation only makes sense
  // when nothing is available
  const availableCount = await prisma.bookCopy.count({
    where: { bookId, status: BookCopyStatus.AVAILABLE },
  });
  if (availableCount > 0) {
    throw createError(
      "Copies are still available — no need to reserve. Please borrow directly.",
      409,
    );
  }

  // User must not already have an active reservation for the same book
  const existing = await prisma.reservation.findFirst({
    where: { userId, bookId, status: ReservationStatus.ACTIVE },
  });
  if (existing) {
    throw createError(
      "You already have an active reservation for this book",
      409,
    );
  }

  const reservation = await prisma.reservation.create({
    data: {
      userId,
      bookId,
      status: ReservationStatus.ACTIVE,
    },
    include: {
      book: { select: { id: true, title: true, author: true } },
      user: { select: { id: true, fullName: true, email: true } },
    },
  });

  // Audit
  await prisma.$transaction(async (tx) => {
    await auditLogger.log(tx, {
      actorId: userId,
      action: "RESERVE",
      targetType: "reservation",
      targetId: reservation.id,
      details: { bookId, bookTitle: book.title },
      ipAddress,
    });
  });

  return reservation;
}

/**
 * Cancel a reservation – the owner or librarian/admin can cancel.
 */
async function cancelReservation({ reservationId, userId, role, ipAddress }) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
  });

  if (!reservation) throw createError("Reservation not found", 404);
  if (reservation.status !== ReservationStatus.ACTIVE) {
    throw createError("Only active reservations can be canceled", 409);
  }

  // Only owner, librarian, or admin
  const isOwner = reservation.userId === userId;
  const isStaff = role === "librarian" || role === "admin";
  if (!isOwner && !isStaff) {
    throw createError("You can only cancel your own reservations", 403);
  }

  const updated = await prisma.reservation.update({
    where: { id: reservationId },
    data: {
      status: ReservationStatus.CANCELED,
      canceledAt: new Date(),
    },
    include: {
      book: { select: { id: true, title: true, author: true } },
      user: { select: { id: true, fullName: true, email: true } },
    },
  });

  await prisma.$transaction(async (tx) => {
    await auditLogger.log(tx, {
      actorId: userId,
      action: "CANCEL_RESERVATION",
      targetType: "reservation",
      targetId: reservationId,
      details: { bookId: reservation.bookId },
      ipAddress,
    });
  });

  return updated;
}

/**
 * Fulfill a reservation – librarian marks it fulfilled when assigning
 * a copy to the reserved user. Sets copy status to RESERVED and
 * gives an expiry window.
 */
async function fulfillReservation({
  reservationId,
  librarianId,
  bookCopyId,
  ipAddress,
}) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { user: { select: { id: true, fullName: true } } },
  });

  if (!reservation) throw createError("Reservation not found", 404);
  if (reservation.status !== ReservationStatus.ACTIVE) {
    throw createError("Only active reservations can be fulfilled", 409);
  }

  // Verify copy belongs to the reserved book and is AVAILABLE
  const copy = await prisma.bookCopy.findUnique({
    where: { id: bookCopyId },
    select: { id: true, bookId: true, status: true },
  });
  if (!copy) throw createError("Book copy not found", 404);
  if (copy.bookId !== reservation.bookId) {
    throw createError("This copy does not belong to the reserved book", 400);
  }
  if (copy.status !== BookCopyStatus.AVAILABLE) {
    throw createError("Book copy is not available", 409);
  }

  const expiresAt = addDays(new Date(), RESERVATION_EXPIRY_DAYS);

  // Use a transaction to update both reservation and copy atomically
  const [updated] = await prisma.$transaction([
    prisma.reservation.update({
      where: { id: reservationId },
      data: {
        status: ReservationStatus.FULFILLED,
        fulfilledAt: new Date(),
        expiresAt,
      },
      include: {
        book: { select: { id: true, title: true, author: true } },
        user: { select: { id: true, fullName: true, email: true } },
      },
    }),
    prisma.bookCopy.update({
      where: { id: bookCopyId },
      data: { status: BookCopyStatus.RESERVED },
    }),
    // TODO: enable when notifications are ready
    // prisma.notification.create({
    //   data: {
    //     userId: reservation.userId,
    //     type: "SYSTEM",
    //     message: `Your reservation for "${reservation.user.fullName}" has been fulfilled. Please pick up the book within ${RESERVATION_EXPIRY_DAYS} days.`,
    //   },
    // }),
  ]);

  await prisma.$transaction(async (tx) => {
    await auditLogger.log(tx, {
      actorId: librarianId,
      action: "FULFILL_RESERVATION",
      targetType: "reservation",
      targetId: reservationId,
      details: { bookCopyId, userId: reservation.userId },
      ipAddress,
    });
  });

  return updated;
}

/**
 * List reservations – users see their own; librarian/admin see all.
 */
async function listReservations({
  userId,
  role,
  status,
  bookId,
  page = 1,
  limit = 20,
}) {
  const isStaff = role === "librarian" || role === "admin";

  const where = {};
  if (!isStaff) where.userId = userId;
  if (status) where.status = status;
  if (bookId) where.bookId = Number(bookId);

  const [reservations, total] = await Promise.all([
    prisma.reservation.findMany({
      where,
      include: {
        book: { select: { id: true, title: true, author: true } },
        user: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.reservation.count({ where }),
  ]);

  return {
    reservations,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get queue position for a specific user + book.
 */
async function getQueuePosition(userId, bookId) {
  const activeReservations = await prisma.reservation.findMany({
    where: { bookId, status: ReservationStatus.ACTIVE },
    orderBy: { createdAt: "asc" },
    select: { id: true, userId: true },
  });

  const idx = activeReservations.findIndex((r) => r.userId === userId);
  return {
    totalInQueue: activeReservations.length,
    position: idx >= 0 ? idx + 1 : null,
  };
}

// TODO: enable when notifications are ready
// async function notifyNextInQueue(bookId, tx) {
//   const next = await tx.reservation.findFirst({
//     where: { bookId, status: ReservationStatus.ACTIVE },
//     orderBy: { createdAt: "asc" },
//     include: {
//       book: { select: { title: true } },
//     },
//   });
//
//   if (next) {
//     await tx.notification.create({
//       data: {
//         userId: next.userId,
//         type: "SYSTEM",
//         message: `Good news! A copy of "${next.book.title}" is now available. Your reservation is next in the queue.`,
//       },
//     });
//   }
//
//   return next;
// }
async function notifyNextInQueue(_bookId, _tx) {
  // TODO: enable when notifications are ready
  return null;
}

module.exports = {
  createReservation,
  cancelReservation,
  fulfillReservation,
  listReservations,
  getQueuePosition,
  notifyNextInQueue,
};
