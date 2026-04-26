require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/authRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const bookRoutes = require("./routes/bookRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const overdueRoutes = require("./routes/overdueRoutes");
// const notificationRoutes = require("./routes/notificationRoutes"); // TODO: enable when notifications are ready
const userRoutes = require("./routes/userRoutes");
const roleRoutes = require("./routes/roleRoutes");
const policyRoutes = require("./routes/policyRoutes");
const auditLogRoutes = require("./routes/auditLogRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const reservationRoutes = require("./routes/reservationRoutes");
const reportRoutes = require("./routes/reportRoutes");

const app = express();

function isAllowedOrigin(origin) {
  if (!origin) return true;

  const configuredOrigins = new Set(
    [
      process.env.FRONTEND_URL,
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ].filter(Boolean),
  );

  if (configuredOrigins.has(origin)) {
    return true;
  }

  if (process.env.NODE_ENV === "production") {
    return false;
  }

  try {
    const url = new URL(origin);
    return ["localhost", "127.0.0.1"].includes(url.hostname);
  } catch {
    return false;
  }
}

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/transactions", transactionRoutes);
app.use("/api/v1/books", bookRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/overdue", overdueRoutes);
// app.use("/api/v1/notifications", notificationRoutes); // TODO: enable when notifications are ready
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/roles", roleRoutes);
app.use("/api/v1/borrowing-policies", policyRoutes);
app.use("/api/v1/audit-logs", auditLogRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/reservations", reservationRoutes);
app.use("/api/v1/reports", reportRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Library Management API is running" });
});

module.exports = app;
