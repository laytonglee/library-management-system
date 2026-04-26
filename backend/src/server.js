const app = require("./app");
const { startOverdueJob } = require("./jobs/overdueJob");

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Welcome to the backend server!");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}: http://localhost:${PORT}`);

  const intervalMs = parseInt(process.env.OVERDUE_CHECK_INTERVAL_MS, 10);
  if (intervalMs > 0) {
    startOverdueJob(intervalMs);
    console.log(`[overdueJob] started — checking every ${intervalMs}ms`);
  }
});
