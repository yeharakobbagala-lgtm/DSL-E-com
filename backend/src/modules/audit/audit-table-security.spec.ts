import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

describe('Audit Table Security & Hardening Convention (Phase 3C.3)', () => {
  let appClient: Client;
  let adminClient: Client;

  beforeAll(async () => {
    appClient = new Client({ connectionString: process.env.DATABASE_URL });
    adminClient = new Client({ connectionString: process.env.MIGRATION_DATABASE_URL });
    await appClient.connect();
    await adminClient.connect();
  });

  afterAll(async () => {
    if (appClient) await appClient.end();
    if (adminClient) await adminClient.end();
  });

  describe('1. Existing Audit Table Grants & Triggers', () => {
    it('restricts dsl_app to SELECT and INSERT only on AuditLog and AdminActivityLog', async () => {
      const res = await appClient.query(`
        SELECT table_name, privilege_type 
        FROM information_schema.role_table_grants 
        WHERE table_name IN ('AuditLog', 'AdminActivityLog') 
          AND grantee = 'dsl_app'
        ORDER BY table_name, privilege_type;
      `);

      const grants = res.rows;
      const auditLogGrants = grants.filter(r => r.table_name === 'AuditLog').map(r => r.privilege_type);
      const adminActivityGrants = grants.filter(r => r.table_name === 'AdminActivityLog').map(r => r.privilege_type);

      expect(auditLogGrants).toContain('INSERT');
      expect(auditLogGrants).toContain('SELECT');
      expect(auditLogGrants).not.toContain('UPDATE');
      expect(auditLogGrants).not.toContain('DELETE');

      expect(adminActivityGrants).toContain('INSERT');
      expect(adminActivityGrants).toContain('SELECT');
      expect(adminActivityGrants).not.toContain('UPDATE');
      expect(adminActivityGrants).not.toContain('DELETE');
    });

    it('has append-only triggers attached to AuditLog and AdminActivityLog', async () => {
      const res = await appClient.query(`
        SELECT tgname, relname 
        FROM pg_trigger t 
        JOIN pg_class c ON t.tgrelid = c.oid 
        WHERE relname IN ('AuditLog', 'AdminActivityLog') 
          AND NOT tgisinternal;
      `);

      const triggerNames = res.rows.map(r => r.tgname);
      expect(triggerNames).toContain('auditlog_prevent_tamper');
      expect(triggerNames).toContain('auditlog_prevent_truncate');
      expect(triggerNames).toContain('adminactivitylog_prevent_tamper');
      expect(triggerNames).toContain('adminactivitylog_prevent_truncate');
    });
  });

  describe('2. Normal Application Tables CRUD Preservation', () => {
    it('preserves full CRUD permissions (SELECT, INSERT, UPDATE, DELETE) for dsl_app on business tables', async () => {
      const res = await appClient.query(`
        SELECT table_name, privilege_type 
        FROM information_schema.role_table_grants 
        WHERE table_name IN ('Product', 'Category', 'Order', 'CartItem') 
          AND grantee = 'dsl_app'
        ORDER BY table_name, privilege_type;
      `);

      const byTable: Record<string, string[]> = {};
      for (const row of res.rows) {
        if (!byTable[row.table_name]) byTable[row.table_name] = [];
        byTable[row.table_name].push(row.privilege_type);
      }

      for (const table of ['Product', 'Category', 'Order', 'CartItem']) {
        expect(byTable[table]).toContain('SELECT');
        expect(byTable[table]).toContain('INSERT');
        expect(byTable[table]).toContain('UPDATE');
        expect(byTable[table]).toContain('DELETE');
      }
    });
  });

  describe('3. Reusable Migration Procedure (secure_audit_table)', () => {
    const testTableName = 'TestAuditVerificationTable';

    beforeAll(async () => {
      await adminClient.query(`DROP TABLE IF EXISTS "${testTableName}" CASCADE;`);
      await adminClient.query(`
        CREATE TABLE "${testTableName}" (
          id SERIAL PRIMARY KEY,
          event_name TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
      `);
    });

    afterAll(async () => {
      await adminClient.query(`DROP TABLE IF EXISTS "${testTableName}" CASCADE;`);
    });

    it('enforces least privilege and security attributes on secure_audit_table procedure', async () => {
      const res = await adminClient.query(`
        SELECT 
          p.proname AS procedure_name,
          pg_get_userbyid(p.proowner) AS procedure_owner,
          p.prosecdef AS is_security_definer,
          p.proacl AS access_control_list,
          has_function_privilege('public', p.oid, 'EXECUTE') AS public_execute,
          has_function_privilege('dsl_app', p.oid, 'EXECUTE') AS dsl_app_execute,
          has_function_privilege('postgres', p.oid, 'EXECUTE') AS migration_role_execute
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'secure_audit_table';
      `);

      expect(res.rows.length).toBe(1);
      const proc = res.rows[0];
      expect(proc.procedure_owner).toBe('postgres');
      expect(proc.is_security_definer).toBe(false);
      expect(proc.public_execute).toBe(false);
      expect(proc.dsl_app_execute).toBe(false);
      expect(proc.migration_role_execute).toBe(true);
    });

    it('strictly rejects execution attempts by runtime dsl_app role', async () => {
      let rejected = false;
      let errorCode = '';
      try {
        await appClient.query("CALL secure_audit_table('AuditLog');");
      } catch (err: any) {
        rejected = true;
        errorCode = err.code;
        expect(err.message).toMatch(/permission denied for procedure secure_audit_table/i);
      }
      expect(rejected).toBe(true);
      expect(errorCode).toBe('42501'); // insufficient_privilege
    });

    it('secures a new audit table using secure_audit_table procedure', async () => {
      // Execute the procedure as postgres
      await adminClient.query(`CALL secure_audit_table('${testTableName}');`);

      // Verify permissions for dsl_app
      const grantRes = await adminClient.query(`
        SELECT privilege_type 
        FROM information_schema.role_table_grants 
        WHERE table_name = '${testTableName}' AND grantee = 'dsl_app';
      `);
      const privs = grantRes.rows.map(r => r.privilege_type);
      expect(privs).toContain('SELECT');
      expect(privs).toContain('INSERT');
      expect(privs).not.toContain('UPDATE');
      expect(privs).not.toContain('DELETE');

      // Verify sequence permissions (USAGE granted, UPDATE revoked for dsl_app)
      const seqCheckRes = await adminClient.query(`
        SELECT 
          has_sequence_privilege('dsl_app', quote_ident(c_seq.relname), 'USAGE') AS has_usage,
          has_sequence_privilege('dsl_app', quote_ident(c_seq.relname), 'UPDATE') AS has_update
        FROM pg_class c_tab
        JOIN pg_depend d ON d.refobjid = c_tab.oid AND d.classid = 'pg_class'::regclass
        JOIN pg_class c_seq ON d.objid = c_seq.oid AND c_seq.relkind = 'S'
        JOIN pg_namespace n ON c_tab.relnamespace = n.oid
        WHERE n.nspname = 'public' AND c_tab.relname = '${testTableName}';
      `);
      expect(seqCheckRes.rows.length).toBeGreaterThan(0);
      expect(seqCheckRes.rows[0].has_usage).toBe(true);
      expect(seqCheckRes.rows[0].has_update).toBe(false);

      // Verify dsl_app can INSERT
      const insertRes = await appClient.query(`
        INSERT INTO "${testTableName}" (event_name) VALUES ('SECURITY_PROBE_EVENT') RETURNING id;
      `);
      const insertedId = insertRes.rows[0].id;
      expect(insertedId).toBeDefined();

      // Verify dsl_app can SELECT
      const selectRes = await appClient.query(`
        SELECT * FROM "${testTableName}" WHERE id = $1;
      `, [insertedId]);
      expect(selectRes.rows.length).toBe(1);
      expect(selectRes.rows[0].event_name).toBe('SECURITY_PROBE_EVENT');

      // Verify dsl_app CANNOT UPDATE (blocked by trigger or permission)
      let updateFailed = false;
      try {
        await appClient.query(`
          UPDATE "${testTableName}" SET event_name = 'TAMPERED' WHERE id = $1;
        `, [insertedId]);
      } catch (err) {
        updateFailed = true;
      }
      expect(updateFailed).toBe(true);

      // Verify dsl_app CANNOT DELETE (blocked by trigger or permission)
      let deleteFailed = false;
      try {
        await appClient.query(`
          DELETE FROM "${testTableName}" WHERE id = $1;
        `, [insertedId]);
      } catch (err) {
        deleteFailed = true;
      }
      expect(deleteFailed).toBe(true);

      // Verify dsl_app CANNOT TRUNCATE
      let truncateFailed = false;
      try {
        await appClient.query(`TRUNCATE TABLE "${testTableName}";`);
      } catch (err) {
        truncateFailed = true;
      }
      expect(truncateFailed).toBe(true);
    });
  });

  describe('4. Static Migration Repository Review', () => {
    it('verifies all audit migrations include hardening triggers or procedure calls', () => {
      const migrationsDir = path.resolve(__dirname, '../../../prisma/migrations');
      const migrationFolders = fs.readdirSync(migrationsDir).filter(f => {
        return fs.statSync(path.join(migrationsDir, f)).isDirectory();
      });

      for (const folder of migrationFolders) {
        const sqlPath = path.join(migrationsDir, folder, 'migration.sql');
        if (!fs.existsSync(sqlPath)) continue;

        const content = fs.readFileSync(sqlPath, 'utf8');
        // If a migration specifically deals with audit table protection or procedures
        if (
          folder.includes('audit_tables_append_only') ||
          folder.includes('audit_table_protection') ||
          folder.includes('harden_audit_procedure')
        ) {
          expect(
            content.includes('prevent_audit_log_tampering') ||
            content.includes('secure_audit_table')
          ).toBe(true);
        }
      }
    });
  });
});

