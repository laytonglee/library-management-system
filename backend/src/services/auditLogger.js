// backend/src/services/auditLogger.js

/**
 * Write a single append-only entry to audit_logs.
 * MUST be called inside an existing Prisma $transaction — never standalone.
 *
 * @param {object} tx - Prisma transaction client
 * @param {object} entry
 * @param {number|null} entry.actorId
 * @param {string}      entry.action       - e.g. "CHECKOUT", "RETURN", "LOGIN"
 * @param {string|null} entry.targetType   - e.g. "transaction", "book", "user"
 * @param {object|null} entry.details      - arbitrary JSON payload
 * @param {string|null} entry.ipAddress
 */
async function log(tx, { actorId, action, targetType = null, details = null, ipAddress = null }) {
  return tx.auditLog.create({
    data: {
      actorId: actorId ?? null,
      action,
      targetType,
      details,
      ipAddress,
    },
  });
}

module.exports = { log };
