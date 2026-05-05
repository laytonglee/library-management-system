const overdueService = require("../services/overdueService");

let handle = null;

async function runOnce() {
  const [overdueCount, reminderCount] = await Promise.all([
    overdueService.detectAndFlagOverdue(),
    overdueService.sendDueReminders(),
  ]);
  console.log(`[overdueJob] flagged ${overdueCount} overdue, sent ${reminderCount} due reminder(s)`);
  return { overdueCount, reminderCount };
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
