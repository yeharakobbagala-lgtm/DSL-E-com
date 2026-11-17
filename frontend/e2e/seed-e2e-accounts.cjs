const path = require('path');
const { Pool } = require(path.join(__dirname, '../../backend/node_modules/pg'));
const bcrypt = require(path.join(__dirname, '../../backend/node_modules/bcrypt'));
require(path.join(__dirname, '../../backend/node_modules/dotenv')).config({
  path: path.join(__dirname, '../../backend/.env'),
});

async function seed() {
  // ─── 0. PRODUCTION SAFETY GUARDS ──────────────────────────────────────────
  if (process.env.NODE_ENV === 'production') {
    throw new Error('CRITICAL SAFETY GUARD: seed-e2e-accounts.cjs is strictly forbidden from executing in NODE_ENV=production');
  }

  const connectionString = process.env.E2E_DATABASE_URL;
  if (!connectionString) {
    throw new Error('CRITICAL CONFIGURATION ERROR: E2E_DATABASE_URL environment variable is missing.');
  }

  const parsedUrl = new URL(connectionString);
  const allowedHosts = ['localhost', '127.0.0.1', '::1'];
  if (!allowedHosts.includes(parsedUrl.hostname)) {
    throw new Error(`CRITICAL SAFETY GUARD: Database host "${parsedUrl.hostname}" is not an allowed local test host (${allowedHosts.join(', ')}).`);
  }

  const pool = new Pool({ connectionString });

  // Verify database connection identity and enforce dedicated test database & least-privilege role
  const identityRes = await pool.query('SELECT current_user, current_database();');
  const { current_user, current_database } = identityRes.rows[0];

  const lowerDb = current_database.toLowerCase();
  if (lowerDb.includes('prod') || lowerDb === 'production') {
    await pool.end();
    throw new Error(`CRITICAL SAFETY GUARD: Target database "${current_database}" appears to be a production database. Seeding aborted.`);
  }

  if (current_database !== 'dsl_stationery_e2e') {
    await pool.end();
    throw new Error(`CRITICAL SAFETY GUARD: Target database "${current_database}" is NOT the dedicated E2E database ("dsl_stationery_e2e"). Seeding aborted.`);
  }

  if (current_user !== 'dsl_app') {
    await pool.end();
    throw new Error(`CRITICAL SAFETY GUARD: Current database role "${current_user}" is NOT the least-privilege runtime role "dsl_app". Connection as superuser (e.g. postgres) is strictly forbidden for E2E execution.`);
  }

  console.log(`[Safety Guard Verified] Target Database: "${current_database}", Runtime Role: "${current_user}", Host: "${parsedUrl.hostname}"`);
  console.log('Seeding Playwright E2E test users...');

  // 1. Fetch system roles
  const rolesRes = await pool.query(`SELECT id, slug FROM "roles" WHERE slug IN ('super_admin', 'project_manager', 'order_manager');`);
  const roles = {};
  for (const r of rolesRes.rows) {
    roles[r.slug] = r.id;
  }
  console.log('Found system roles:', roles);

  if (!roles['super_admin']) {
    await pool.end();
    throw new Error('CRITICAL ERROR: "super_admin" role not found in dsl_stationery_e2e database.');
  }

  // 2. Hash passwords (12 rounds)
  const superPass = await bcrypt.hash('AdminPassword123!', 12);
  const managerPass = await bcrypt.hash('ManagerPassword123!', 12);
  const orderPass = await bcrypt.hash('OrderMgrPassword123!', 12);
  const quarantinePass = await bcrypt.hash('QuarantinePass123!', 12);

  // 3. Upsert Dedicated E2E Super Admin (Do NOT touch operational admin@dslstationery.lk)
  await pool.query(`
    INSERT INTO "User" (id, email, name, role, "roleId", "passwordHash", "isActive", "failedLoginAttempts", "lockedUntil", "updatedAt")
    VALUES ('e2e-superadmin-id', 'e2e.superadmin@dslstationery.lk', 'E2E Super Admin', 'ADMIN', $1, $2, true, 0, NULL, NOW())
    ON CONFLICT (email) DO UPDATE SET
      role = 'ADMIN',
      "roleId" = $1,
      "passwordHash" = $2,
      "isActive" = true,
      "failedLoginAttempts" = 0,
      "lockedUntil" = NULL,
      "updatedAt" = NOW();
  `, [roles['super_admin'], superPass]);
  console.log('Upserted E2E Super Admin: e2e.superadmin@dslstationery.lk');

  // 4. Upsert Project Manager
  await pool.query(`
    INSERT INTO "User" (id, email, name, role, "roleId", "passwordHash", "isActive", "failedLoginAttempts", "lockedUntil", "updatedAt")
    VALUES ('e2e-proj-mgr-id', 'e2e.project.manager@dslstationery.lk', 'E2E Project Manager', 'ADMIN', $1, $2, true, 0, NULL, NOW())
    ON CONFLICT (email) DO UPDATE SET
      role = 'ADMIN',
      "roleId" = $1,
      "passwordHash" = $2,
      "isActive" = true,
      "failedLoginAttempts" = 0,
      "lockedUntil" = NULL,
      "updatedAt" = NOW();
  `, [roles['project_manager'], managerPass]);
  console.log('Upserted Project Manager: e2e.project.manager@dslstationery.lk');

  // 5. Upsert Order Manager
  await pool.query(`
    INSERT INTO "User" (id, email, name, role, "roleId", "passwordHash", "isActive", "failedLoginAttempts", "lockedUntil", "updatedAt")
    VALUES ('e2e-order-mgr-id', 'e2e.order.manager@dslstationery.lk', 'E2E Order Manager', 'ADMIN', $1, $2, true, 0, NULL, NOW())
    ON CONFLICT (email) DO UPDATE SET
      role = 'ADMIN',
      "roleId" = $1,
      "passwordHash" = $2,
      "isActive" = true,
      "failedLoginAttempts" = 0,
      "lockedUntil" = NULL,
      "updatedAt" = NOW();
  `, [roles['order_manager'], orderPass]);
  console.log('Upserted Order Manager: e2e.order.manager@dslstationery.lk');

  // 6. Upsert Quarantined Admin
  await pool.query(`
    INSERT INTO "User" (id, email, name, role, "roleId", "passwordHash", "isActive", "failedLoginAttempts", "lockedUntil", "updatedAt")
    VALUES ('e2e-quarantined-id', 'e2e.quarantined@dslstationery.lk', 'E2E Quarantined Admin', 'ADMIN', NULL, $1, true, 0, NULL, NOW())
    ON CONFLICT (email) DO UPDATE SET
      role = 'ADMIN',
      "roleId" = NULL,
      "passwordHash" = $1,
      "isActive" = true,
      "failedLoginAttempts" = 0,
      "lockedUntil" = NULL,
      "updatedAt" = NOW();
  `, [quarantinePass]);
  console.log('Upserted Quarantined Admin: e2e.quarantined@dslstationery.lk');

  // 7. Clean up ephemeral E2E dynamic test roles to maintain invariant test hygiene
  await pool.query(`
    DELETE FROM "role_permissions"
    WHERE "roleId" IN (
      SELECT id FROM "roles" WHERE slug LIKE 'test_role_%' OR slug LIKE 'e2e_%' OR name LIKE 'E2E%'
    );
  `);
  await pool.query(`
    DELETE FROM "roles"
    WHERE slug LIKE 'test_role_%' OR slug LIKE 'e2e_%' OR name LIKE 'E2E%';
  `);
  console.log('Cleaned up dynamic E2E test roles.');

  // 8. Seed/Reset Bank Deposit Review Queue Test Record (for Workflow 12 E2E test)
  const prodRes = await pool.query(`SELECT id, name, sku FROM "Product" LIMIT 1;`);
  let productId = 'prod-e2e-placeholder';
  let productName = 'Atlas Exercise Book 80 Pages';
  let productSku = 'DSL-ATL-EX-80';

  if (prodRes.rows.length > 0) {
    productId = prodRes.rows[0].id;
    productName = prodRes.rows[0].name;
    productSku = prodRes.rows[0].sku;
  }

  // Upsert test Order
  await pool.query(`
    INSERT INTO "Order" (
      id, "orderNumber", "customerName", "customerEmail", "customerPhone",
      "subtotalCents", "discountCents", "deliveryCents", "totalCents",
      "paymentMethod", "paymentStatus", "orderStatus", "createdAt", "updatedAt"
    ) VALUES (
      'e2e-ord-bank-001', 'DSL-2026-E2E-BANK', 'Kasun Mendis', 'kasun.mendis@example.com', '0771234567',
      500000, 0, 0, 500000,
      'BANK_TRANSFER', 'PENDING', 'PENDING', NOW(), NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      "paymentStatus" = 'PENDING',
      "orderStatus" = 'PENDING',
      "notes" = NULL,
      "updatedAt" = NOW();
  `);

  // Upsert test OrderItem
  await pool.query(`
    INSERT INTO "OrderItem" (
      id, "orderId", "productId", "productName", "sku", "unitPriceCents", "quantity", "totalPriceCents", "createdAt"
    ) VALUES (
      'e2e-ord-item-001', 'e2e-ord-bank-001', $1, $2, $3, 500000, 1, 500000, NOW()
    )
    ON CONFLICT (id) DO NOTHING;
  `, [productId, productName, productSku]);

  // Upsert test BankDepositSubmission (Status = PENDING)
  await pool.query(`
    INSERT INTO "BankDepositSubmission" (
      id, "orderId", "referenceNumber", "depositDate", "amountCents",
      "receiptStorageKey", "originalFilename", "fileSizeBytes", "mimeType",
      status, "createdAt", "updatedAt"
    ) VALUES (
      'e2e-bank-sub-001', 'e2e-ord-bank-001', 'TX-E2E-REF-999', NOW(), 500000,
      'receipts/e2e-deposit-slip.png', 'deposit_slip.png', 102400, 'image/png',
      'PENDING', NOW(), NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      status = 'PENDING',
      "reviewedById" = NULL,
      "reviewedAt" = NULL,
      "rejectionReason" = NULL,
      "updatedAt" = NOW();
  `);
  console.log('Upserted Bank Transfer review queue test submission: e2e-bank-sub-001 (PENDING)');

  await pool.end();
  console.log('Seeding completed successfully.');
}

seed().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
