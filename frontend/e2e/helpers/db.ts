import path from 'path';

// Load pg and dotenv from backend node_modules
const { Pool } = require(path.join(__dirname, '../../../backend/node_modules/pg'));
const dotenv = require(path.join(__dirname, '../../../backend/node_modules/dotenv'));

dotenv.config({ path: path.join(__dirname, '../../../backend/.env') });

export function getE2EPool() {
  const connectionString = process.env.E2E_DATABASE_URL;
  if (!connectionString) {
    throw new Error('E2E_DATABASE_URL is not defined in backend/.env');
  }
  return new Pool({ connectionString });
}

export async function queryLatestAuditLog(action: string, entityId: string) {
  const pool = getE2EPool();
  try {
    const res = await pool.query(
      `SELECT id, action, "entityType", "entityId", "userId", description, "createdAt"
       FROM "AuditLog"
       WHERE action = $1 AND "entityId" = $2
       ORDER BY "createdAt" DESC
       LIMIT 1;`,
      [action, entityId]
    );
    return res.rows[0] || null;
  } finally {
    await pool.end();
  }
}

export async function getBankDepositSubmission(submissionId: string) {
  const pool = getE2EPool();
  try {
    const res = await pool.query(
      `SELECT id, "orderId", "referenceNumber", "amountCents", status, "reviewedById", "reviewedAt"
       FROM "BankDepositSubmission"
       WHERE id = $1;`,
      [submissionId]
    );
    return res.rows[0] || null;
  } finally {
    await pool.end();
  }
}
