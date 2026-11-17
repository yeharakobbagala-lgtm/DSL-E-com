-- Phase 3C: Database-Level Audit Tamper Resistance
-- Enforces append-only immutability triggers on AuditLog and AdminActivityLog.

-- 1. Create or replace the tamper-prevention trigger function
CREATE OR REPLACE FUNCTION prevent_audit_log_tampering()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        RAISE EXCEPTION 'Audit records are append-only: UPDATE operation is strictly prohibited on table "%"', TG_TABLE_NAME
            USING ERRCODE = 'integrity_constraint_violation',
                  HINT = 'Audit logs are immutable for compliance and security auditability.';
    ELSIF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'Audit records are append-only: DELETE operation is strictly prohibited on table "%"', TG_TABLE_NAME
            USING ERRCODE = 'integrity_constraint_violation',
                  HINT = 'Audit logs cannot be deleted once created.';
    ELSIF TG_OP = 'TRUNCATE' THEN
        RAISE EXCEPTION 'Audit records are append-only: TRUNCATE operation is strictly prohibited on table "%"', TG_TABLE_NAME
            USING ERRCODE = 'integrity_constraint_violation',
                  HINT = 'Audit tables cannot be truncated.';
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 2. Drop existing triggers if present to ensure clean idempotent creation
DROP TRIGGER IF EXISTS audit_log_prevent_tamper ON "AuditLog";
DROP TRIGGER IF EXISTS audit_log_prevent_truncate ON "AuditLog";
DROP TRIGGER IF EXISTS admin_activity_log_prevent_tamper ON "AdminActivityLog";
DROP TRIGGER IF EXISTS admin_activity_log_prevent_truncate ON "AdminActivityLog";

-- 3. Create triggers for "AuditLog"
CREATE TRIGGER audit_log_prevent_tamper
BEFORE UPDATE OR DELETE ON "AuditLog"
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_log_tampering();

CREATE TRIGGER audit_log_prevent_truncate
BEFORE TRUNCATE ON "AuditLog"
FOR EACH STATEMENT
EXECUTE FUNCTION prevent_audit_log_tampering();

-- 4. Create triggers for "AdminActivityLog"
CREATE TRIGGER admin_activity_log_prevent_tamper
BEFORE UPDATE OR DELETE ON "AdminActivityLog"
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_log_tampering();

CREATE TRIGGER admin_activity_log_prevent_truncate
BEFORE TRUNCATE ON "AdminActivityLog"
FOR EACH STATEMENT
EXECUTE FUNCTION prevent_audit_log_tampering();
