const overdueService = require("../services/overdueService");

let handle = null;

async function runOnce() {
<<<<<<< HEAD
  const [flagged, reminded] = await Promise.all([
    overdueService.detectAndFlagOverdue(),
    overdueService.sendDueReminders(),
  ]);
  console.log(`[overdueJob] flagged ${flagged} overdue, sent ${reminded} due reminder(s)`);
  return { flagged, reminded };
=======
  const [overdueCount, reminderCount] = await Promise.all([
    overdueService.detectAndFlagOverdue(),
    overdueService.sendDueReminders(),
  ]);
  console.log(`[overdueJob] flagged ${overdueCount} overdue, sent ${reminderCount} due reminder(s)`);
  return { overdueCount, reminderCount };
>>>>>>> b609f86d91f47ee4b5899f75ea6970ad41844ba1
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
