-- Phase 3C.3: Automated and Reusable Audit Table Protection Procedure
-- Enables single-line hardening for any newly created or existing audit table.

CREATE OR REPLACE PROCEDURE secure_audit_table(p_table_name text)
LANGUAGE plpgsql
AS $$
DECLARE
    v_seq_record RECORD;
    v_trig_record RECORD;
BEGIN
    -- 1. Ensure table exists in public schema
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = p_table_name
    ) THEN
        RAISE EXCEPTION 'Table "%" does not exist in schema "public"', p_table_name;
    END IF;

    -- 2. Revoke destructive DML from runtime application role
    EXECUTE format('REVOKE UPDATE, DELETE, TRUNCATE ON TABLE %I FROM dsl_app', p_table_name);

    -- 3. Grant legitimate read and append permissions
    EXECUTE format('GRANT SELECT, INSERT ON TABLE %I TO dsl_app', p_table_name);

    -- 4. Restrict any sequences owned by or associated with this table
    FOR v_seq_record IN (
        SELECT c_seq.relname AS sequence_name
        FROM pg_class c_tab
        JOIN pg_depend d ON d.refobjid = c_tab.oid AND d.classid = 'pg_class'::regclass
        JOIN pg_class c_seq ON d.objid = c_seq.oid AND c_seq.relkind = 'S'
        JOIN pg_namespace n ON c_tab.relnamespace = n.oid
        WHERE n.nspname = 'public' AND c_tab.relname = p_table_name
    ) LOOP
        EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE %I TO dsl_app', v_seq_record.sequence_name);
        EXECUTE format('REVOKE UPDATE ON SEQUENCE %I FROM dsl_app', v_seq_record.sequence_name);
    END LOOP;

    -- Also check sequences matched by naming convention
    FOR v_seq_record IN (
        SELECT s.sequence_name
        FROM information_schema.sequences s
        WHERE s.sequence_schema = 'public'
          AND (
            lower(s.sequence_name) = lower(p_table_name) || '_id_seq'
            OR lower(s.sequence_name) LIKE lower(p_table_name) || '%_seq'
          )
    ) LOOP
        EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE %I TO dsl_app', v_seq_record.sequence_name);
        EXECUTE format('REVOKE UPDATE ON SEQUENCE %I FROM dsl_app', v_seq_record.sequence_name);
    END LOOP;

    -- 5. Drop any prior tamper-prevention triggers on this table to prevent duplicates
    FOR v_trig_record IN (
        SELECT t.tgname 
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_proc p ON t.tgfoid = p.oid
        WHERE c.relname = p_table_name AND p.proname = 'prevent_audit_log_tampering'
    ) LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', v_trig_record.tgname, p_table_name);
    END LOOP;

    -- 6. Attach append-only row trigger (blocks UPDATE and DELETE)
    EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_tampering()', lower(p_table_name) || '_prevent_tamper', p_table_name);

    -- 7. Attach append-only statement trigger (blocks TRUNCATE)
    EXECUTE format('CREATE TRIGGER %I BEFORE TRUNCATE ON %I FOR EACH STATEMENT EXECUTE FUNCTION prevent_audit_log_tampering()', lower(p_table_name) || '_prevent_truncate', p_table_name);

    RAISE NOTICE 'Audit table "%" successfully secured with append-only triggers and restricted dsl_app permissions.', p_table_name;
END;
$$;

-- Secure existing audit tables to guarantee consistent state across all registered audit entities
CALL secure_audit_table('AuditLog');
CALL secure_audit_table('AdminActivityLog');
