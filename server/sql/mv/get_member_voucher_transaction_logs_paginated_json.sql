CREATE OR REPLACE FUNCTION get_member_voucher_transaction_logs_paginated_json(
    p_limit INTEGER,
    p_start_date_utc TIMESTAMPTZ DEFAULT NULL,
    p_end_date_utc TIMESTAMPTZ DEFAULT NULL,
    p_after_created_at TIMESTAMPTZ DEFAULT NULL,
    p_after_id INTEGER DEFAULT NULL,
    p_before_created_at TIMESTAMPTZ DEFAULT NULL,
    p_before_id INTEGER DEFAULT NULL,
    p_page INTEGER DEFAULT NULL,
    p_member_voucher_id INTEGER DEFAULT 31
)
RETURNS JSON AS $$
DECLARE
    v_base_query_from TEXT := 'FROM member_voucher_transaction_logs mvtl';
    v_select_list TEXT := 'mvtl.*';
    v_filter_conditions TEXT[];
    v_cursor_conditions TEXT[];
    v_final_where_clause TEXT := '';
    v_order_by TEXT;
    v_data_query TEXT;
    v_offset INTEGER := 0;
    v_effective_limit INTEGER := p_limit;
    v_filter_where_clause TEXT := '';
    
    v_total_count BIGINT;
    v_fetched_rows JSON;
    v_actual_fetched_count INTEGER;
BEGIN

    v_filter_conditions := array_append(v_filter_conditions, format('mvtl.member_voucher_id = %s', p_member_voucher_id));

    IF p_start_date_utc IS NOT NULL THEN
        v_filter_conditions := array_append(v_filter_conditions, format('mvtl.created_at >= %L', p_start_date_utc));
    END IF;

    IF p_end_date_utc IS NOT NULL THEN
        v_filter_conditions := array_append(v_filter_conditions, format('mvtl.created_at <= %L', p_end_date_utc));
    END IF;

    IF array_length(v_filter_conditions, 1) > 0 THEN
        v_filter_where_clause := 'WHERE ' || array_to_string(v_filter_conditions, ' AND ');
    END IF;

    -- Calculate total_count based on these filters only
    EXECUTE 'SELECT COUNT(*) ' || v_base_query_from || ' ' || v_filter_where_clause
    INTO v_total_count;

    -- Build full query for data fetching
    v_final_where_clause := v_filter_where_clause; 

    IF p_page IS NOT NULL AND p_page > 0 THEN
        -- Offset-based pagination
        v_offset := (p_page - 1) * p_limit;
        v_order_by := 'ORDER BY mvtl.service_date DESC, mvtl.id ASC';
        v_data_query := format('SELECT %s %s %s %s OFFSET %s LIMIT %s',
                            v_select_list, v_base_query_from, v_final_where_clause, v_order_by, v_offset, p_limit);
    ELSE
        -- Cursor-based pagination
        v_effective_limit := p_limit + 1; -- Fetch one extra

        IF p_after_created_at IS NOT NULL AND p_after_id IS NOT NULL THEN
            v_order_by := 'ORDER BY mvtl.service_date DESC, mvtl.id ASC';
            v_cursor_conditions := array_append(v_cursor_conditions,
                format('(mvtl.service_date > %L OR (mvtl.service_date = %L AND mvtl.id > %s))',
                       p_after_created_at, p_after_created_at, p_after_id)
            );
        ELSIF p_before_created_at IS NOT NULL AND p_before_id IS NOT NULL THEN
            v_order_by := 'ORDER BY mvtl.service_date ASC, mvtl.id DESC'; -- Fetch in reverse for 'before'
            v_cursor_conditions := array_append(v_cursor_conditions,
                format('(mvtl.service_date < %L OR (mvtl.service_date = %L AND mvtl.id < %s))',
                       p_before_created_at, p_before_created_at, p_before_id)
            );
        ELSE
             v_order_by := 'ORDER BY mvtl.service_date DESC, mvtl.id ASC'; -- Default order
        END IF;

        IF array_length(v_cursor_conditions, 1) > 0 THEN
            IF v_final_where_clause = '' THEN
                v_final_where_clause := 'WHERE ' || array_to_string(v_cursor_conditions, ' AND ');
            ELSE
                v_final_where_clause := v_final_where_clause || ' AND (' || array_to_string(v_cursor_conditions, ' AND ') || ')';
            END IF;
        END IF;
        
        v_data_query := format('SELECT %s %s %s %s LIMIT %s',
                             v_select_list, v_base_query_from, v_final_where_clause, v_order_by, v_effective_limit);
    END IF;

    -- Execute data query and build JSON array
    DECLARE
        temp_table_name TEXT := 'paginated_data_temp_' || replace(gen_random_uuid()::text, '-', '');
    BEGIN
        EXECUTE format('CREATE TEMP TABLE %I ON COMMIT DROP AS %s', temp_table_name, v_data_query);
        EXECUTE format('SELECT count(*) FROM %I', temp_table_name) INTO v_actual_fetched_count;
        
        IF p_page IS NOT NULL AND p_page > 0 THEN -- Offset pagination
            EXECUTE format(
                'SELECT COALESCE(json_agg(row_to_json(t.*) ORDER BY t.service_date DESC, t.id ASC), ''[]''::JSON) FROM (SELECT * FROM %I) t', -- MODIFIED: ::JSON
                temp_table_name
            ) INTO v_fetched_rows;
        ELSIF p_before_created_at IS NOT NULL THEN -- Cursor 'before'
            EXECUTE format(
                'SELECT COALESCE(json_agg(sub.* ORDER BY sub.service_date DESC, sub.id ASC), ''[]''::JSON) -- MODIFIED: ::JSON
                 FROM (
                     SELECT * FROM %I 
                     LIMIT %L 
                 ) sub',
                temp_table_name, p_limit 
            ) INTO v_fetched_rows;
        ELSE -- Cursor 'after' or initial load (no cursor)
            EXECUTE format(
                'SELECT COALESCE(json_agg(row_to_json(t.*) ORDER BY t.service_date DESC, t.id ASC), ''[]''::JSON) FROM (SELECT * FROM %I LIMIT %L) t', -- MODIFIED: ::JSON
                temp_table_name, p_limit
            ) INTO v_fetched_rows;
        END IF;
    END;

    RETURN json_build_object(
        'data', v_fetched_rows,
        'totalCount', v_total_count,
        'actual_fetched_count', v_actual_fetched_count 
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error in get_member_voucher_transaction_logs_paginated_json: % - Query: %', SQLERRM, v_data_query;
        RETURN json_build_object(
            'data', '[]'::JSON,
            'totalCount', 0,
            'actual_fetched_count', 0,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql VOLATILE;