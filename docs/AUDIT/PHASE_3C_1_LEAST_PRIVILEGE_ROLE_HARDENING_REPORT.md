# PHASE 3C.1: POSTGRESQL LEAST-PRIVILEGE APPLICATION ROLE HARDENING REPORT
## DSL Stationery E-Commerce Platform

**Date:** November 16, 2026  
**Status:** FULLY HARDENED AND VERIFIED  
**Runtime Role:** `dsl_app`  
**Migration Role:** `postgres`  
**Database:** PostgreSQL 18.4 (`dsl_stationery`)  
**ORM:** Prisma 7 with Driver Adapter (`@prisma/adapter-pg`)  

---

## 1. Executive Summary

In Phase 3C, database-level triggers were applied to `"AuditLog"` and `"AdminActivityLog"` to prohibit `UPDATE`, `DELETE`, and `TRUNCATE` operations. However, the NestJS application was still connecting as the PostgreSQL superuser `postgres`.

Phase 3C.1 successfully decoupled runtime application traffic from database administration. A dedicated least-privilege role, `dsl_app`, was provisioned and configured as the default runtime user. 

`dsl_app` has zero superuser privileges, does not own the audit tables or triggers, and is strictly restricted to `SELECT` and `INSERT` on audit tables. Regular store operations (products, orders, customers, carts, sessions, etc.) retain full CRUD access. DDL and migration privileges remain isolated to `MIGRATION_DATABASE_URL` used exclusively during deployments.

---

## 2. Configuration & Role Attributes

### A. Role Attributes (`dsl_app`):
```sql
SELECT rolname, rolsuper, rolinherit, rolcreaterole, rolcreatedb, rolcanlogin, rolreplication
FROM pg_roles WHERE rolname = 'dsl_app';
```
| Attribute | Value | Security Impact |
|---|---|---|
| `rolname` | `dsl_app` | Dedicated application role |
| `rolsuper` | `false` | **Non-Superuser**: Cannot bypass PostgreSQL permissions, RLS, or triggers |
| `rolinherit` | `true` | Standard PostgreSQL role inheritance |
| `rolcreaterole` | `false` | Cannot create or alter database roles |
| `rolcreatedb` | `false` | Cannot create or drop databases |
| `rolcanlogin` | `true` | Allows authenticated TCP connection via password |
| `rolreplication` | `false` | Cannot initiate replication streams or read WAL |

### B. Audit Table Ownership:
- `AuditLog`: Owned by `postgres` (NOT `dsl_app`).
- `AdminActivityLog`: Owned by `postgres` (NOT `dsl_app`).
- Trigger Function `prevent_audit_log_tampering()`: Owned by `postgres`.

Because `dsl_app` does not own the tables or the function, it cannot execute `ALTER TABLE ... DISABLE TRIGGER`, `DROP TRIGGER`, or `DROP FUNCTION`.

---

## 3. Grants Assigned to `dsl_app`

```sql
-- 1. Database & Schema Access
GRANT CONNECT ON DATABASE dsl_stationery TO dsl_app;
GRANT USAGE ON SCHEMA public TO dsl_app;

-- 2. Standard Store Entities (Full CRUD for legitimate store operations)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO dsl_app;

-- 3. Strict Append-Only Restriction on Audit Tables
REVOKE UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON "AuditLog", "AdminActivityLog" FROM dsl_app;
GRANT SELECT, INSERT ON "AuditLog", "AdminActivityLog" TO dsl_app;

-- 4. Migration Table Protection
REVOKE UPDATE, DELETE, TRUNCATE, INSERT ON "_prisma_migrations" FROM dsl_app;
GRANT SELECT ON "_prisma_migrations" TO dsl_app;

-- 5. Sequences and Function Execution
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO dsl_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO dsl_app;

-- 6. Default Privileges for Future Tables
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO dsl_app;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO dsl_app;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO dsl_app;
```

---

## 4. Separation of Migration & Runtime Privileges

To ensure the principle of least privilege, two distinct connection strings are established:

1. **Runtime Application Traffic (`DATABASE_URL`):**
   - Configured in `backend/.env`.
   - Used by `PrismaService` via `@prisma/adapter-pg` at runtime.
   - Credentials: `postgresql://dsl_app:[REDACTED]@localhost:5432/dsl_stationery?schema=public`
   - Privileges: DML only (`SELECT`, `INSERT`, `UPDATE`, `DELETE`), with `UPDATE`/`DELETE` blocked on audit tables.
2. **Database Migration & DDL Traffic (`MIGRATION_DATABASE_URL`):**
   - Configured in `backend/.env` and referenced in `backend/prisma.config.ts`.
   - Used exclusively by Prisma CLI (`prisma migrate deploy`, `prisma migrate dev`).
   - Credentials: `postgresql://postgres:[REDACTED]@localhost:5432/dsl_stationery?schema=public`
   - Privileges: DDL (`CREATE TABLE`, `ALTER TABLE`, `DROP TABLE`, triggers, indexes).

---

## 5. Security Verification Test Results

All eight security verification tests were executed by connecting directly under the `dsl_app` role:

| # | Test Scenario | Command / Target | Expected Behavior | Actual Result | Status |
|---|---|---|---|---|---|
| 1 | **Audit Reading** | `SELECT COUNT(*) FROM "AuditLog"` & `"AdminActivityLog"` | Must succeed | Read 1,609+ and 41+ records | **PASSED** |
| 2 | **Audit Insertion** | `INSERT INTO "AuditLog"` & `"AdminActivityLog"` | Must succeed | Both rows inserted | **PASSED** |
| 3 | **Audit Modification** | `UPDATE "AuditLog"` & `"AdminActivityLog"` | Must fail | `permission denied for table AuditLog` | **PASSED** |
| 4 | **Audit Deletion** | `DELETE FROM "AuditLog"` & `"AdminActivityLog"` | Must fail | `permission denied for table AuditLog` | **PASSED** |
| 5 | **Audit Table Truncate** | `TRUNCATE TABLE "AuditLog"` & `"AdminActivityLog"` | Must fail | `permission denied for table AuditLog` | **PASSED** |
| 6 | **Disable Triggers** | `ALTER TABLE "AuditLog" DISABLE TRIGGER ALL` | Must fail | `must be owner of table AuditLog` | **PASSED** |
| 7 | **Drop Trigger** | `DROP TRIGGER audit_log_prevent_tamper ON "AuditLog"` | Must fail | `must be owner of relation AuditLog` | **PASSED** |
| 8 | **Drop Function** | `DROP FUNCTION prevent_audit_log_tampering()` | Must fail | `must be owner of function prevent_audit_log_tampering` | **PASSED** |
| 9 | **Privilege Escalation** | `SET ROLE postgres` | Must fail | `permission denied to set role "postgres"` | **PASSED** |

---

## 6. Application Regression Testing (Under `dsl_app`)

Live NestJS and Prisma operations were tested on the running backend server connected as `dsl_app`:

1. **NestJS Bootstrap:** Started successfully without error; connected via `@prisma/adapter-pg`.
2. **Customer Authentication:** Customer login verified (`HTTP 200 OK`).
3. **Administrator Authentication:** Administrator login verified (`HTTP 200 OK`).
4. **Product Catalogue & Categories:** Fetched live products (5 items) and categories (20 items) without issue (`HTTP 200 OK`).
5. **Prisma AuditLog.create:** Succeeded (`cmwj3xb8j0000b4usdbgsc0bm`).
6. **Prisma AdminActivityLog.create:** Succeeded (`cmwj3xb8s0001b4usbvvqp1lo`).
7. **Audit Filtering & Pagination:** `findMany` with filtering and pagination returned correct results.
8. **CSV Export Generation:** Generated 44 lines of CSV audit exports through `AuditService.exportActivitiesCsv`.
9. **Tamper Attempt via Application Pool:** Direct update query over `DATABASE_URL` pool threw `permission denied for table AuditLog`.
10. **Historical Integrity:** All historical records remain intact.

---

## 7. Build & Unit Test Verification

- **Prisma Migrations:** `18 migrations applied`, schema up to date.
- **Backend Unit & Service Tests:** **62/62 passed** (`auth.service.spec.ts`, `admin-auth.spec.ts`, `change-password.dto.spec.ts`, `audit.service.spec.ts`).
- **Backend Production Build (`nest build`):** **Code 0, Build succeeded**.

---

## 8. Remaining Security Limitations

1. **Host-Level Root / DBA Access:**
   - Any operator with physical, operating system, or direct PostgreSQL superuser access to the database host can connect as `postgres` or alter database files on disk.
   - Hardware-level WORM (Write Once Read Many) storage or external off-site immutable log streaming (e.g. AWS S3 Object Lock, CloudTrail) is required for air-gapped forensic immutability against host compromise.
2. **Application Role Compromise:**
   - If `dsl_app` credentials are leaked, the attacker cannot delete or modify historical audit logs, but could still insert misleading audit entries or manipulate non-audit store tables. Application-level API guards and network isolation (PostgreSQL binding to localhost / private VPC) mitigate external credential reuse.
