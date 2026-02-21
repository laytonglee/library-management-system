require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/authRoutes");

const app = express();
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Library Management API is running" });
});

module.exports = app;
