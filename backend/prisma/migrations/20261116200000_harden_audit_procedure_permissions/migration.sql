-- Phase 3C.4: Final Audit Procedure Permission Hardening
-- Restrict execution of secure_audit_table to authorized migration/administrative role (postgres)
-- and revoke all execution privileges from PUBLIC and dsl_app.

-- 1. Revoke EXECUTE from PUBLIC
REVOKE EXECUTE ON PROCEDURE secure_audit_table(text) FROM PUBLIC;

-- 2. Explicitly revoke EXECUTE from the runtime application role
REVOKE EXECUTE ON PROCEDURE secure_audit_table(text) FROM dsl_app;

-- 3. Explicitly confirm and grant EXECUTE to the migration/administrative role
GRANT EXECUTE ON PROCEDURE secure_audit_table(text) TO postgres;

-- 4. Alter default privileges for role postgres in schema public to prevent auto-granting EXECUTE on routines to PUBLIC and dsl_app
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON ROUTINES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON ROUTINES FROM dsl_app;

