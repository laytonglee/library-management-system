const overdueService = require("../services/overdueService");

let handle = null;

async function runOnce() {
  const count = await overdueService.detectAndFlagOverdue();
  console.log(`[overdueJob] flagged ${count} overdue transaction(s)`);
  return count;
}

function startOverdueJob(intervalMs) {
  if (handle !== null) return;
  runOnce().catch((err) => console.error("[overdueJob] error on first run:", err));
  handle = setInterval(() => {
    runOnce().catch((err) => console.error("[overdueJob] error:", err));
  }, intervalMs);
}

function stopOverdueJob() {
  if (handle !== null) {
    clearInterval(handle);
    handle = null;
  }
}

module.exports = { runOnce, startOverdueJob, stopOverdueJob };
