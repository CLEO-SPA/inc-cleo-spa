-- First drop existing triggers and functions if they exist
DO $$ 
DECLARE
    table_name text;
BEGIN
    FOR table_name IN 
    SELECT unnest(ARRAY[
        'cs_invoices',
        'cs_invoice_items',
        'cs_invoice_payment',
        'cs_member_care_package',
        'cs_member_care_package_details',
        'cs_member_care_package_transaction_logs',
        'cs_stored_value_accounts',
        'cs_stored_value_transactions_logs',
        'cs_employees'
    ])
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I_creation_audit ON %I', table_name, table_name);
        EXECUTE format('DROP TRIGGER IF EXISTS %I_modification_audit ON %I', table_name, table_name);
        EXECUTE format('DROP TRIGGER IF EXISTS %I_deletion_audit ON %I', table_name, table_name);
    END LOOP;
END $$;

DROP FUNCTION IF EXISTS audit_creation_trigger CASCADE;
DROP FUNCTION IF EXISTS audit_modification_trigger CASCADE;
DROP FUNCTION IF EXISTS audit_deletion_trigger CASCADE;
DROP FUNCTION IF EXISTS get_primary_key_column CASCADE;
DROP FUNCTION IF EXISTS set_current_user_id CASCADE;
DROP FUNCTION IF EXISTS debug_log CASCADE;

-- Create audit tables (if they don't exist)
CREATE TABLE IF NOT EXISTS cs_audit_creation_log (
    log_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES cs_employees(employee_id),
    table_name VARCHAR(50),
    record_id BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    data JSONB
);

CREATE TABLE IF NOT EXISTS cs_audit_modification_log (
    log_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES cs_employees(employee_id),
    table_name VARCHAR(50),
    record_id BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    old_data JSONB,
    new_data JSONB,
    changed_fields JSONB
);

CREATE TABLE IF NOT EXISTS cs_audit_deletion_log (
    log_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES cs_employees(employee_id),
    table_name VARCHAR(50),
    record_id BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_data JSONB
);

-- Create debugging function
CREATE OR REPLACE FUNCTION debug_log(message text) RETURNS void AS $$
BEGIN
    RAISE NOTICE '%', message;
END;
$$ LANGUAGE plpgsql;

-- Create the session management function
CREATE OR REPLACE FUNCTION set_current_user_id(user_id BIGINT)
RETURNS void AS $$
BEGIN
    -- Set both session variables
    PERFORM set_config('app.current_user_id', COALESCE(user_id::text, ''), true);
    PERFORM set_config('app.employee_id', COALESCE(user_id::text, ''), true);
    
    -- Add debug logging
    PERFORM debug_log('Setting user ID in session: ' || COALESCE(user_id::text, 'NULL'));
END;
$$ LANGUAGE plpgsql;

-- Create the deletion trigger function
CREATE OR REPLACE FUNCTION audit_deletion_trigger()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id BIGINT;
    record_id BIGINT;
    pk_column text := TG_ARGV[0];
BEGIN
    -- Get employee_id from session context
    BEGIN
        current_user_id := NULLIF(current_setting('app.current_user_id', true), '')::BIGINT;
        
        IF current_user_id IS NULL THEN
            current_user_id := NULLIF(current_setting('app.employee_id', true), '')::BIGINT;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        PERFORM debug_log('Error getting user ID in deletion trigger: ' || SQLERRM);
    END;

    -- Get the record ID
    EXECUTE format('SELECT $1.%I', pk_column)
    INTO record_id
    USING OLD;
    
    -- Create deletion audit log
    INSERT INTO cs_audit_deletion_log (
        user_id,
        table_name,
        record_id,
        deleted_data
    ) VALUES (
        current_user_id,
        TG_TABLE_NAME,
        record_id,
        to_jsonb(OLD)
    );
    
    PERFORM debug_log('Trigger executed for table: ' || TG_TABLE_NAME);
    PERFORM debug_log('Current user ID from app.current_user_id: ' || COALESCE(current_setting('app.current_user_id', true), 'NULL'));
    PERFORM debug_log('Current user ID from app.employee_id: ' || COALESCE(current_setting('app.employee_id', true), 'NULL'));
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create the creation trigger function
CREATE OR REPLACE FUNCTION audit_creation_trigger()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id BIGINT;
    record_id BIGINT;
    pk_column text := TG_ARGV[0];
BEGIN
    -- Get employee_id from session context with fallback logic
    BEGIN
        current_user_id := NULLIF(current_setting('app.employee_id', true), '')::BIGINT;
        PERFORM debug_log('Creation trigger - Initial user_id from employee_id: ' || COALESCE(current_user_id::text, 'NULL'));
        
        IF current_user_id IS NULL THEN
            current_user_id := NULLIF(current_setting('app.current_user_id', true), '')::BIGINT;
            PERFORM debug_log('Creation trigger - user_id from current_user_id: ' || COALESCE(current_user_id::text, 'NULL'));
        END IF;

        -- If still null, try to get from the record
        IF current_user_id IS NULL THEN
            IF TG_TABLE_NAME = 'cs_invoices' THEN
                current_user_id := NEW.employee_id;
            ELSIF TG_TABLE_NAME = 'cs_invoice_payment' THEN
                current_user_id := NEW.invoice_payment_created_by;
            ELSIF TG_TABLE_NAME = 'cs_member_care_package' THEN
                current_user_id := NEW.employee_id;
            END IF;
            PERFORM debug_log('Creation trigger - user_id from record: ' || COALESCE(current_user_id::text, 'NULL'));
        END IF;
    EXCEPTION WHEN OTHERS THEN
        PERFORM debug_log('Error getting user ID in creation trigger: ' || SQLERRM);
    END;

    -- Get the record ID using dynamic primary key column
    EXECUTE format('SELECT $1.%I', pk_column)
    INTO record_id
    USING NEW;

    -- Create audit log even if user_id is NULL
    INSERT INTO cs_audit_creation_log (
        user_id,
        table_name,
        record_id,
        data
    ) VALUES (
        current_user_id,
        TG_TABLE_NAME,
        record_id,
        to_jsonb(NEW)
    );
    
    PERFORM debug_log('Trigger executed for table: ' || TG_TABLE_NAME);
    PERFORM debug_log('Current user ID from app.current_user_id: ' || COALESCE(current_setting('app.current_user_id', true), 'NULL'));
    PERFORM debug_log('Current user ID from app.employee_id: ' || COALESCE(current_setting('app.employee_id', true), 'NULL'));
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Enhanced modification trigger with debugging
CREATE OR REPLACE FUNCTION audit_modification_trigger()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id BIGINT;
    record_id BIGINT;
    changed_fields_json JSONB := '{}'::JSONB;
    pk_column text := TG_ARGV[0];
    col_record RECORD;
BEGIN
    -- Debug logging
    PERFORM debug_log('Modification trigger started for table: ' || TG_TABLE_NAME);
    
    -- Get employee_id from session context with fallback logic
    BEGIN
        current_user_id := NULLIF(current_setting('app.current_user_id', true), '')::BIGINT;
        PERFORM debug_log('Current user ID from app.current_user_id: ' || COALESCE(current_user_id::text, 'NULL'));
        
        IF current_user_id IS NULL THEN
            current_user_id := NULLIF(current_setting('app.employee_id', true), '')::BIGINT;
            PERFORM debug_log('Current user ID from app.employee_id: ' || COALESCE(current_user_id::text, 'NULL'));
        END IF;

        -- If still null, try to get from the record
        IF current_user_id IS NULL THEN
            IF TG_TABLE_NAME = 'cs_invoices' THEN
                current_user_id := NEW.employee_id;
            ELSIF TG_TABLE_NAME = 'cs_invoice_payment' THEN
                current_user_id := NEW.invoice_payment_updated_by;
            ELSIF TG_TABLE_NAME = 'cs_member_care_package' THEN
                current_user_id := NEW.employee_id;
            END IF;
            PERFORM debug_log('Current user ID from record: ' || COALESCE(current_user_id::text, 'NULL'));
        END IF;
    EXCEPTION WHEN OTHERS THEN
        PERFORM debug_log('Error getting user ID in modification trigger: ' || SQLERRM);
    END;

    -- Get the record ID using dynamic primary key column
    BEGIN
        EXECUTE format('SELECT $1.%I', pk_column)
        INTO record_id
        USING NEW;
        PERFORM debug_log('Record ID: ' || COALESCE(record_id::text, 'NULL'));
    EXCEPTION WHEN OTHERS THEN
        PERFORM debug_log('Error getting record ID: ' || SQLERRM);
    END;

    -- Calculate changed fields with better handling
    BEGIN
        FOR col_record IN 
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = TG_TABLE_NAME
        LOOP
            -- Debug each column comparison
            PERFORM debug_log('Checking column: ' || col_record.column_name);
            
            -- Compare OLD and NEW values, handling NULLs properly
            IF (OLD IS NOT NULL AND NEW IS NOT NULL) AND
               (to_jsonb(OLD)->col_record.column_name IS DISTINCT FROM to_jsonb(NEW)->col_record.column_name) THEN
                
                PERFORM debug_log('Change detected in column: ' || col_record.column_name);
                PERFORM debug_log('Old value: ' || COALESCE(to_jsonb(OLD)->>col_record.column_name, 'NULL'));
                PERFORM debug_log('New value: ' || COALESCE(to_jsonb(NEW)->>col_record.column_name, 'NULL'));
                
                changed_fields_json := changed_fields_json || 
                    jsonb_build_object(
                        col_record.column_name,
                        jsonb_build_object(
                            'old', to_jsonb(OLD)->col_record.column_name,
                            'new', to_jsonb(NEW)->col_record.column_name
                        )
                    );
            END IF;
        END LOOP;
    EXCEPTION WHEN OTHERS THEN
        PERFORM debug_log('Error in change detection: ' || SQLERRM);
    END;

    -- Debug the changed fields
    PERFORM debug_log('Changed fields: ' || changed_fields_json::text);

    -- Create audit log entry for all updates
    BEGIN
        INSERT INTO cs_audit_modification_log (
            user_id,
            table_name,
            record_id,
            old_data,
            new_data,
            changed_fields
        ) VALUES (
            current_user_id,
            TG_TABLE_NAME,
            record_id,
            to_jsonb(OLD),
            to_jsonb(NEW),
            changed_fields_json
        );
        PERFORM debug_log('Audit log entry created successfully');
    EXCEPTION WHEN OTHERS THEN
        PERFORM debug_log('Error creating audit log entry: ' || SQLERRM);
    END;

    PERFORM debug_log('Trigger executed for table: ' || TG_TABLE_NAME);
    PERFORM debug_log('Current user ID from app.current_user_id: ' || COALESCE(current_setting('app.current_user_id', true), 'NULL'));
    PERFORM debug_log('Current user ID from app.employee_id: ' || COALESCE(current_setting('app.employee_id', true), 'NULL'));
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to get primary key column name for a table
CREATE OR REPLACE FUNCTION get_primary_key_column(table_name text)
RETURNS text AS $$
DECLARE
    pk_column text;
BEGIN
    SELECT a.attname INTO pk_column
    FROM pg_index i
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
    WHERE i.indrelid = table_name::regclass
    AND i.indisprimary;
    
    RETURN pk_column;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables
DO $$ 
DECLARE
    table_name text;
    pk_column text;
BEGIN
    FOR table_name IN 
    SELECT unnest(ARRAY[
        'cs_invoices',
        'cs_invoice_items',
        'cs_invoice_payment',
        'cs_member_care_package',
        'cs_member_care_package_details',
        'cs_member_care_package_transaction_logs',
        'cs_stored_value_accounts',
        'cs_stored_value_transactions_logs',
        'cs_employees'
    ])
    LOOP
        -- Get primary key column for current table
        pk_column := get_primary_key_column(table_name);

        -- Creation audit trigger
        EXECUTE format('
            CREATE TRIGGER %I_creation_audit
            AFTER INSERT ON %I
            FOR EACH ROW
            EXECUTE FUNCTION audit_creation_trigger(%L);',
            table_name,
            table_name,
            pk_column
        );

        -- Modification audit trigger
        EXECUTE format('
            CREATE TRIGGER %I_modification_audit
            AFTER UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION audit_modification_trigger(%L);',
            table_name,
            table_name,
            pk_column
        );

        -- Deletion audit trigger
        EXECUTE format('
            CREATE TRIGGER %I_deletion_audit
            BEFORE DELETE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION audit_deletion_trigger(%L);',
            table_name,
            table_name,
            pk_column
        );
        
        PERFORM debug_log('Created all triggers for table: ' || table_name);
    END LOOP;
END $$;