import 'dotenv/config';
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function validateAuditTables() {
  console.log('===============================================================');
  console.log(' DSL Stationery — Audit Table Security & Migration Validator');
  console.log('===============================================================\n');

  const appDbUrl = process.env.DATABASE_URL;
  const migrationDbUrl = process.env.MIGRATION_DATABASE_URL;

  if (!appDbUrl) {
    console.error('[-] Error: DATABASE_URL is not set.');
    process.exit(1);
  }

  const appClient = new Client({ connectionString: appDbUrl });
  await appClient.connect();

  let hasError = false;

  try {
    // 1. Verify runtime user identity
    const userRes = await appClient.query('SELECT CURRENT_USER as current_user, SESSION_USER as session_user;');
    const currentUser = userRes.rows[0].current_user;
    console.log(`[+] Runtime Connection User: ${currentUser}`);
    if (currentUser !== 'dsl_app') {
      console.error(`[-] FAILURE: Expected runtime user to be 'dsl_app', found '${currentUser}'`);
      hasError = true;
    } else {
      console.log('    [PASS] Runtime connection is strictly non-superuser dsl_app.');
    }

    // 2. Audit tables grant verification
    const auditTables = ['AuditLog', 'AdminActivityLog'];
    console.log('\n[+] Verifying permissions on core audit tables...');

    for (const table of auditTables) {
      const grantRes = await appClient.query(`
        SELECT privilege_type 
        FROM information_schema.role_table_grants 
        WHERE table_name = $1 AND grantee = 'dsl_app';
      `, [table]);

      const privs = grantRes.rows.map(r => r.privilege_type);
      console.log(`    Table "${table}" grants for dsl_app: [${privs.join(', ')}]`);

      if (!privs.includes('SELECT') || !privs.includes('INSERT')) {
        console.error(`[-] FAILURE: Table "${table}" missing SELECT or INSERT for dsl_app`);
        hasError = true;
      }
      if (privs.includes('UPDATE') || privs.includes('DELETE') || privs.includes('TRUNCATE')) {
        console.error(`[-] FAILURE: Table "${table}" has dangerous UPDATE, DELETE, or TRUNCATE granted to dsl_app!`);
        hasError = true;
      }
    }

    // 3. Audit triggers verification
    console.log('\n[+] Verifying tamper-resistance triggers on core audit tables...');
    for (const table of auditTables) {
      const trigRes = await appClient.query(`
        SELECT tgname 
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE c.relname = $1 AND NOT tgisinternal;
      `, [table]);

      const triggers = trigRes.rows.map(r => r.tgname);
      console.log(`    Table "${table}" triggers: [${triggers.join(', ')}]`);

      const hasTamper = triggers.some(t => t.includes('prevent_tamper'));
      const hasTruncate = triggers.some(t => t.includes('prevent_truncate'));

      if (!hasTamper || !hasTruncate) {
        console.error(`[-] FAILURE: Table "${table}" missing required tamper or truncate triggers!`);
        hasError = true;
      } else {
        console.log(`    [PASS] "${table}" has active row and statement tamper-resistance triggers.`);
      }
    }

    // 4. Normal CRUD preservation on business tables
    console.log('\n[+] Verifying CRUD preservation on business tables...');
    const businessTables = ['Product', 'Category', 'Order', 'CartItem'];
    for (const table of businessTables) {
      const grantRes = await appClient.query(`
        SELECT privilege_type 
        FROM information_schema.role_table_grants 
        WHERE table_name = $1 AND grantee = 'dsl_app';
      `, [table]);
      const privs = grantRes.rows.map(r => r.privilege_type);
      const hasAll = ['SELECT', 'INSERT', 'UPDATE', 'DELETE'].every(p => privs.includes(p));
      if (!hasAll) {
        console.error(`[-] FAILURE: Business table "${table}" is missing required CRUD permissions for dsl_app!`);
        hasError = true;
      } else {
        console.log(`    [PASS] "${table}" retains full CRUD for dsl_app.`);
      }
    }

    // 5. Audit procedure privilege verification
    console.log('\n[+] Verifying procedure execution restrictions...');
    const procCheck = await appClient.query(`
      SELECT 
        has_function_privilege('dsl_app', p.oid, 'EXECUTE') as dsl_app_can_execute,
        has_function_privilege('public', p.oid, 'EXECUTE') as public_can_execute
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname = 'secure_audit_table';
    `);

    if (procCheck.rows.length > 0) {
      const { dsl_app_can_execute, public_can_execute } = procCheck.rows[0];
      if (dsl_app_can_execute || public_can_execute) {
        console.error('[-] FAILURE: secure_audit_table procedure grants EXECUTE to dsl_app or PUBLIC!');
        hasError = true;
      } else {
        console.log('    [PASS] secure_audit_table EXECUTE is strictly revoked from dsl_app and PUBLIC.');
      }
    }

    // 6. Static migration review
    console.log('\n[+] Performing static migration convention review...');
    const migrationsDir = path.resolve(__dirname, '../prisma/migrations');
    if (fs.existsSync(migrationsDir)) {
      const folders = fs.readdirSync(migrationsDir).filter(f => {
        return fs.statSync(path.join(migrationsDir, f)).isDirectory();
      });

      console.log(`    Scanned ${folders.length} migration directories.`);
      // Check procedure presence
      let procedureMigrationFound = false;
      for (const folder of folders) {
        const sqlPath = path.join(migrationsDir, folder, 'migration.sql');
        if (!fs.existsSync(sqlPath)) continue;
        const sql = fs.readFileSync(sqlPath, 'utf8');
        if (sql.includes('secure_audit_table')) {
          procedureMigrationFound = true;
          break;
        }
      }

      if (procedureMigrationFound) {
        console.log('    [PASS] Reusable procedure "secure_audit_table" migration verified.');
      } else {
        console.error('[-] FAILURE: Procedure "secure_audit_table" not found in migrations!');
        hasError = true;
      }
    }

    if (hasError) {
      console.error('\n[-] Audit table security validation FAILED.');
      process.exit(1);
    } else {
      console.log('\n[+] All audit table security and convention checks PASSED successfully.\n');
    }
  } finally {
    await appClient.end();
  }
}

validateAuditTables().catch(err => {
  console.error('[-] Unexpected error during validation:', err);
  process.exit(1);
});
