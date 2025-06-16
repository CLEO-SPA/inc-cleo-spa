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
    v_is_before_cursor BOOLEAN := FALSE;
BEGIN
    -- Log debug info
    RAISE NOTICE 'TRANSACTION LOGS PAGINATION DEBUG: member_voucher_id=%, limit=%, after_id=%, before_id=%, page=%', 
        p_member_voucher_id, p_limit, p_after_id, p_before_id, p_page;

    -- Always filter by member_voucher_id
    v_filter_conditions := array_append(v_filter_conditions, format('mvtl.member_voucher_id = %s', p_member_voucher_id));

    -- Add date filters
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
        -- Offset-based pagination - consistent ordering DESC, DESC
        v_offset := (p_page - 1) * p_limit;
        v_order_by := 'ORDER BY mvtl.service_date DESC, mvtl.id DESC';
        v_data_query := format('SELECT %s %s %s %s OFFSET %s LIMIT %s',
                            v_select_list, v_base_query_from, v_final_where_clause, v_order_by, v_offset, p_limit);
        
        RAISE NOTICE 'OFFSET QUERY: %', v_data_query;
    ELSE
        -- Cursor-based pagination
        v_effective_limit := p_limit + 1; -- Fetch one extra
        
        v_order_by := 'ORDER BY mvtl.service_date DESC, mvtl.id DESC';

        IF p_after_created_at IS NOT NULL AND p_after_id IS NOT NULL THEN
            -- Next page: get records that come AFTER the cursor in our DESC, DESC order
            v_cursor_conditions := array_append(v_cursor_conditions,
                format('(mvtl.service_date < %L OR (mvtl.service_date = %L AND mvtl.id < %s))',
                       p_after_created_at, p_after_created_at, p_after_id)
            );
            RAISE NOTICE 'CURSOR AFTER: service_date < % OR (service_date = % AND id < %)', 
                p_after_created_at, p_after_created_at, p_after_id;
                
        ELSIF p_before_created_at IS NOT NULL AND p_before_id IS NOT NULL THEN
            -- Previous page: get records that come BEFORE the cursor in our DESC, DESC order
            v_cursor_conditions := array_append(v_cursor_conditions,
                format('(mvtl.service_date > %L OR (mvtl.service_date = %L AND mvtl.id > %s))',
                       p_before_created_at, p_before_created_at, p_before_id)
            );
            v_order_by := 'ORDER BY mvtl.service_date ASC, mvtl.id ASC'; -- Reverse order to get previous records
            v_is_before_cursor := TRUE;
            RAISE NOTICE 'CURSOR BEFORE: service_date > % OR (service_date = % AND id > %), reversed order', 
                p_before_created_at, p_before_created_at, p_before_id;
        ELSE
            RAISE NOTICE 'CURSOR INITIAL: No cursor, using default DESC, DESC order';
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
        
        RAISE NOTICE 'CURSOR QUERY: %', v_data_query;
    END IF;

    -- Execute data query and build JSON array
    DECLARE
        temp_table_name TEXT := 'paginated_data_temp_' || replace(gen_random_uuid()::text, '-', '');
    BEGIN
        EXECUTE format('CREATE TEMP TABLE %I ON COMMIT DROP AS %s', temp_table_name, v_data_query);
        EXECUTE format('SELECT count(*) FROM %I', temp_table_name) INTO v_actual_fetched_count;
        
        RAISE NOTICE 'FETCHED COUNT: %', v_actual_fetched_count;
        
        IF p_page IS NOT NULL AND p_page > 0 THEN 
            -- Offset pagination - return in standard DESC, DESC order
            EXECUTE format(
                'SELECT COALESCE(json_agg(row_to_json(t.*) ORDER BY t.service_date DESC, t.id DESC), ''[]''::JSON) FROM %I t',
                temp_table_name
            ) INTO v_fetched_rows;
        ELSIF v_is_before_cursor THEN 
            -- Cursor 'before' - we fetched in reverse order (ASC, ASC), but need to return in standard order (DESC, DESC)
            EXECUTE format(
                'SELECT COALESCE(json_agg(sub.* ORDER BY sub.service_date DESC, sub.id DESC), ''[]''::JSON)
                 FROM (
                     SELECT * FROM %I 
                     ORDER BY service_date ASC, id ASC
                     LIMIT %L 
                 ) sub',
                temp_table_name, p_limit 
            ) INTO v_fetched_rows;
        ELSE 
            -- Cursor 'after' or initial load - return in standard DESC, DESC order, limit to p_limit
            EXECUTE format(
                'SELECT COALESCE(json_agg(row_to_json(t.*) ORDER BY t.service_date DESC, t.id DESC), ''[]''::JSON) 
                 FROM (SELECT * FROM %I ORDER BY service_date DESC, id DESC LIMIT %L) t',
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