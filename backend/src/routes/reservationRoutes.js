// backend/src/routes/reservationRoutes.js
const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/reservationController");
const {
  authenticateToken,
  requirePermission,
} = require("../middleware/authMiddleware");

router.use(authenticateToken);

// Any authenticated user can create a reservation
router.post("/", ctrl.create);

// List reservations (own for students/teachers, all for staff)
router.get("/", ctrl.list);

// Get queue position for a specific book
router.get("/queue/:bookId", ctrl.queuePosition);

// Cancel a reservation (owner or staff)
router.put("/:id/cancel", ctrl.cancel);

// Fulfill a reservation (librarian/admin only)
router.put("/:id/fulfill", requirePermission("checkout_book"), ctrl.fulfill);

module.exports = router;
