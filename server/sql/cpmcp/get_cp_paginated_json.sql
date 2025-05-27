CREATE OR REPLACE FUNCTION get_cp_paginated_json(
    p_limit INTEGER,
    p_search_term TEXT DEFAULT NULL,
    p_start_date_utc TIMESTAMPTZ DEFAULT NULL,
    p_end_date_utc TIMESTAMPTZ DEFAULT NULL,
    p_after_created_at TIMESTAMPTZ DEFAULT NULL,
    p_after_id INTEGER DEFAULT NULL,
    p_before_created_at TIMESTAMPTZ DEFAULT NULL,
    p_before_id INTEGER DEFAULT NULL,
    p_page INTEGER DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_base_query_from TEXT := 'FROM care_packages cp';
    v_select_list TEXT := 'cp.*';
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
    -- Build WHERE clause for basic filters (search, dates)
    IF p_search_term IS NOT NULL AND p_search_term <> '' THEN
        v_filter_conditions := array_append(v_filter_conditions,
            format('(cp.care_package_name ILIKE %L OR cp.care_package_remarks ILIKE %L)',
                   '%' || p_search_term || '%', '%' || p_search_term || '%')
        );
    END IF;

    IF p_start_date_utc IS NOT NULL THEN
        v_filter_conditions := array_append(v_filter_conditions, format('cp.created_at >= %L', p_start_date_utc));
    END IF;

    IF p_end_date_utc IS NOT NULL THEN
        v_filter_conditions := array_append(v_filter_conditions, format('cp.created_at <= %L', p_end_date_utc));
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
        v_order_by := 'ORDER BY cp.created_at ASC, cp.id ASC';
        v_data_query := format('SELECT %s %s %s %s OFFSET %s LIMIT %s',
                            v_select_list, v_base_query_from, v_final_where_clause, v_order_by, v_offset, p_limit);
    ELSE
        -- Cursor-based pagination
        v_effective_limit := p_limit + 1; -- Fetch one extra

        IF p_after_created_at IS NOT NULL AND p_after_id IS NOT NULL THEN
            v_order_by := 'ORDER BY cp.created_at ASC, cp.id ASC';
            v_cursor_conditions := array_append(v_cursor_conditions,
                format('(cp.created_at > %L OR (cp.created_at = %L AND cp.id > %s))',
                       p_after_created_at, p_after_created_at, p_after_id)
            );
        ELSIF p_before_created_at IS NOT NULL AND p_before_id IS NOT NULL THEN
            v_order_by := 'ORDER BY cp.created_at DESC, cp.id DESC'; -- Fetch in reverse for 'before'
            v_cursor_conditions := array_append(v_cursor_conditions,
                format('(cp.created_at < %L OR (cp.created_at = %L AND cp.id < %s))',
                       p_before_created_at, p_before_created_at, p_before_id)
            );
        ELSE
             v_order_by := 'ORDER BY cp.created_at ASC, cp.id ASC'; -- Default order
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
                'SELECT COALESCE(json_agg(row_to_json(t.*) ORDER BY t.created_at ASC, t.id ASC), ''[]''::JSON) FROM (SELECT * FROM %I) t', -- MODIFIED: ::JSON
                temp_table_name
            ) INTO v_fetched_rows;
        ELSIF p_before_created_at IS NOT NULL THEN -- Cursor 'before'
            EXECUTE format(
                'SELECT COALESCE(json_agg(sub.* ORDER BY sub.created_at ASC, sub.id ASC), ''[]''::JSON) -- MODIFIED: ::JSON
                 FROM (
                     SELECT * FROM %I 
                     LIMIT %L 
                 ) sub',
                temp_table_name, p_limit 
            ) INTO v_fetched_rows;
        ELSE -- Cursor 'after' or initial load (no cursor)
            EXECUTE format(
                'SELECT COALESCE(json_agg(row_to_json(t.*) ORDER BY t.created_at ASC, t.id ASC), ''[]''::JSON) FROM (SELECT * FROM %I LIMIT %L) t', -- MODIFIED: ::JSON
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
        RAISE WARNING 'Error in get_care_packages_paginated_json: % - Query: %', SQLERRM, v_data_query;
        RETURN json_build_object(
            'data', '[]'::JSON,
            'totalCount', 0,
            'actual_fetched_count', 0,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql VOLATILE;