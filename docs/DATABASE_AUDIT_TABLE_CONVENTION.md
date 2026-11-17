# PostgreSQL Audit Table Hardening Convention & Migration Standard
**Project:** DSL Stationery E-Commerce Platform  
**Effective Date:** November 16, 2026 (Phase 3C.3)  
**Classification:** Engineering & Security Standard  

---

## 1. Background & Architectural Context

The DSL Stationery platform runs under a decoupled database privilege model:
1. **Migrations Connection (`MIGRATION_DATABASE_URL`):** Connects as PostgreSQL superuser `postgres` exclusively during deployment / schema migrations (`prisma migrate deploy`).
2. **Runtime Application Connection (`DATABASE_URL`):** Connects as dedicated non-superuser `dsl_app` (`NOSUPERUSER`, `NOCREATEDB`, `NOCREATEROLE`, `NOREPLICATION`).

### Why `pg_default_acl` Retains `arwd` for `dsl_app`
PostgreSQL default privileges for schema `public` grant `arwd` (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) to `dsl_app` for newly created tables. This is intentional: normal application entities (such as `Product`, `Category`, `Order`, `CartItem`, `Review`, `Banner`, etc.) require full CRUD capabilities for regular business operations without requiring boilerplate `GRANT` statements in every business migration.

However, **audit, ledger, and compliance tables** must adhere to strict **append-only immutability** and **least-privilege boundaries**.

---

## 2. Security Invariants for All Audit Tables

Every current and future audit table (e.g. `AuditLog`, `AdminActivityLog`, and future tables such as `FinancialAuditLog`, `SecurityEventLog`) MUST satisfy the following five invariants:

1. **No Destructive Permissions:** `dsl_app` MUST NOT possess `UPDATE`, `DELETE`, or `TRUNCATE` permissions on the table.
2. **Legitimate Logging Permissions:** `dsl_app` MUST possess `SELECT` and `INSERT` permissions.
3. **Database-Level Immutability Triggers:** The table MUST have append-only triggers attached:
   - `BEFORE UPDATE OR DELETE FOR EACH ROW` executing `prevent_audit_log_tampering()`.
   - `BEFORE TRUNCATE FOR EACH STATEMENT` executing `prevent_audit_log_tampering()`.
4. **Sequence Least-Privilege:** Any primary key sequences (SERIAL / BIGSERIAL / IDENTITY) associated with the audit table MUST grant only `USAGE, SELECT` to `dsl_app` and MUST NOT grant `UPDATE`.
5. **No Cascading Deletion:** Foreign key relationships pointing to audit tables MUST NOT use `onDelete: Cascade`. They must use `onDelete: SetNull` or avoid foreign keys altogether (storing immutable entity ID and snapshot strings).

---

## 3. Migration Implementation Guide

When adding a new audit or ledger model in Prisma (e.g. in `schema.prisma`), follow this procedure:

### Step 1: Create the Prisma Migration
Generate the migration without immediate deployment:
```bash
npx prisma migrate dev --create-only --name add_new_audit_table
```

### Step 2: Add Hardening to `migration.sql`

#### Method A: Reusable Stored Procedure (Recommended)
Add the single-line procedure call at the end of the generated `migration.sql`:

```sql
-- Hardening: Lock down the new audit table
CALL secure_audit_table('YourNewAuditTable');
```

The `secure_audit_table(text)` stored procedure automatically:
- Revokes `UPDATE, DELETE, TRUNCATE` from `dsl_app`.
- Grants `SELECT, INSERT` to `dsl_app`.
- Configures all associated sequences to `USAGE, SELECT` only.
- Attaches `_prevent_tamper` (UPDATE/DELETE) and `_prevent_truncate` (TRUNCATE) triggers executing `prevent_audit_log_tampering()`.

> **Security & Privilege Invariant (Phase 3C.4):**
> `secure_audit_table` operates as `SECURITY INVOKER` under owner `postgres`. `EXECUTE` privileges are strictly revoked from `PUBLIC` and `dsl_app`, restricting execution exclusively to the migration/administrative connection (`MIGRATION_DATABASE_URL`). Furthermore, PostgreSQL default privileges in `public` revoke `EXECUTE` on routines from `PUBLIC` and `dsl_app`.

---

#### Method B: Standalone SQL Statements (Alternative)
If manual SQL is preferred, include the following explicit block:

```sql
-- 1. Revoke destructive DML
REVOKE UPDATE, DELETE, TRUNCATE ON TABLE "YourNewAuditTable" FROM dsl_app;

-- 2. Grant legitimate append & read privileges
GRANT SELECT, INSERT ON TABLE "YourNewAuditTable" TO dsl_app;

-- 3. Grant sequence USAGE if auto-incrementing
DO $$
DECLARE
    v_seq text;
BEGIN
    SELECT pg_get_serial_sequence('"YourNewAuditTable"', 'id') INTO v_seq;
    IF v_seq IS NOT NULL THEN
        EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE %s TO dsl_app', v_seq);
        EXECUTE format('REVOKE UPDATE ON SEQUENCE %s FROM dsl_app', v_seq);
    END IF;
END $$;

-- 4. Attach tamper prevention triggers
DROP TRIGGER IF EXISTS yournewaudittable_prevent_tamper ON "YourNewAuditTable";
CREATE TRIGGER yournewaudittable_prevent_tamper
BEFORE UPDATE OR DELETE ON "YourNewAuditTable"
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_log_tampering();

DROP TRIGGER IF EXISTS yournewaudittable_prevent_truncate ON "YourNewAuditTable";
CREATE TRIGGER yournewaudittable_prevent_truncate
BEFORE TRUNCATE ON "YourNewAuditTable"
FOR EACH STATEMENT
EXECUTE FUNCTION prevent_audit_log_tampering();
```

---

## 4. Automated CI & Pre-Deployment Verification

The project provides automated tooling to verify that all audit tables satisfy these security constraints before and after deployment:

1. **Automated CLI Validator:**
   ```bash
   npm run audit:validate
   ```
   Runs `backend/scripts/validate-audit-tables.ts` which checks runtime role identity, live table grants, triggers, business table CRUD preservation, and scans migration files.

2. **Automated Vitest Suite:**
   ```bash
   npx vitest run src/modules/audit/audit-table-security.spec.ts
   ```
   Executes unit and integration checks against the database, including live simulation of new audit table creation and verification of tamper rejection.
