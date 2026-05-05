const overdueService = require("../services/overdueService");

let handle = null;

async function runOnce() {
  const [flagged, reminded] = await Promise.all([
    overdueService.detectAndFlagOverdue(),
    overdueService.sendDueReminders(),
  ]);
  console.log(`[overdueJob] flagged ${flagged} overdue, sent ${reminded} due reminder(s)`);
  return { flagged, reminded };
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
