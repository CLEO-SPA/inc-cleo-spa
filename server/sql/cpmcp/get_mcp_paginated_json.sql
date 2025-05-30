CREATE OR REPLACE FUNCTION get_mcp_paginated_json(
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
    v_base_from_joins TEXT := 'FROM member_care_packages mcp
        LEFT JOIN employees e ON mcp.member_id = e.id
        LEFT JOIN members m ON mcp.member_id = m.id
        LEFT JOIN statuses s ON mcp.status_id = s.id
        LEFT JOIN member_care_package_details mcpd ON mcp.id = mcpd.member_care_package_id
        LEFT JOIN member_care_package_transaction_logs mcptl ON mcpd.id = mcptl.member_care_package_details_id';

    -- SELECT list with correlated subqueries
    v_select_list TEXT := $SQL$
    mcp.id AS mcp_id, 
    mcp.package_name,
    s.status_name,
    mcp.package_remarks,
    m.name AS member_name,
    e.employee_name,
    mcp.total_price,
    mcp.created_at,
    mcp.updated_at,
    (
        SELECT COALESCE(ARRAY_AGG(
            jsonb_build_object(
                'id', mcpd_s.id,
                'discount', mcpd_s.discount,
                'price', mcpd_s.price,
                'member_care_package_id', mcpd_s.member_care_package_id,
                'service_id', mcpd_s.service_id,
                'status_id', mcpd_s.status_id,
                'quantity', mcpd_s.quantity
            ) ORDER BY mcpd_s.id ASC
        ), '{}'::jsonb[])
        FROM member_care_package_details mcpd_s
        WHERE mcpd_s.member_care_package_id = mcp.id
    ) AS package_details,
    (
        SELECT COALESCE(ARRAY_AGG(
            jsonb_build_object(
                'id', mcptl_s.id,
                'type', mcptl_s.type,
                'description', mcptl_s.description,
                'transaction_date', mcptl_s.transaction_date,
                'transaction_amount', mcptl_s.transaction_amount,
                'amount_changed', mcptl_s.amount_changed,
                'created_at', mcptl_s.created_at,
                'member_care_package_details_id', mcptl_s.member_care_package_details_id,
                'employee_id', mcptl_s.employee_id,
                'service_id', mcptl_s.service_id
            ) ORDER BY mcptl_s.created_at ASC
        ), '{}'::jsonb[])
        FROM member_care_package_details mcpd_l_s
        JOIN member_care_package_transaction_logs mcptl_s ON mcpd_l_s.id = mcptl_s.member_care_package_details_id
        WHERE mcpd_l_s.member_care_package_id = mcp.id
    ) AS transaction_logs
    $SQL$;

    v_group_by_sql TEXT := 'GROUP BY mcp.id, s.status_name, m.name, e.employee_name';

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
            -- ADJUST SEARCHABLE FIELDS AS NEEDED:
            format('(mcp.package_name ILIKE %L OR mcp.remarks ILIKE %L OR m.name ILIKE %L OR e.employee_name ILIKE %L)',
                   '%' || p_search_term || '%', '%' || p_search_term || '%', '%' || p_search_term || '%', '%' || p_search_term || '%')
        );
    END IF;

    IF p_start_date_utc IS NOT NULL THEN
        v_filter_conditions := array_append(v_filter_conditions, format('mcp.created_at >= %L', p_start_date_utc));
    END IF;

    IF p_end_date_utc IS NOT NULL THEN
        v_filter_conditions := array_append(v_filter_conditions, format('mcp.created_at <= %L', p_end_date_utc));
    END IF;

    IF array_length(v_filter_conditions, 1) > 0 THEN
        v_filter_where_clause := 'WHERE ' || array_to_string(v_filter_conditions, ' AND ');
    END IF;

    -- Calculate total_count based on filtered groups
    EXECUTE 'SELECT COUNT(*) FROM (SELECT 1 ' || v_base_from_joins || ' ' || v_filter_where_clause || ' ' || v_group_by_sql || ') AS count_subquery'
    INTO v_total_count;

    -- Build full query for data fetching
    v_final_where_clause := v_filter_where_clause; 

    IF p_page IS NOT NULL AND p_page > 0 THEN
        v_offset := (p_page - 1) * p_limit;
        v_order_by := 'ORDER BY mcp.created_at ASC, mcp.id ASC'; -- CORRECTED ALIAS
        v_data_query := format('SELECT %s %s %s %s %s OFFSET %s LIMIT %s',
                                v_select_list, v_base_from_joins, v_final_where_clause, v_group_by_sql, v_order_by, v_offset, p_limit);
    ELSE
        v_effective_limit := p_limit + 1; 

        IF p_after_created_at IS NOT NULL AND p_after_id IS NOT NULL THEN
            v_order_by := 'ORDER BY mcp.created_at ASC, mcp.id ASC'; -- CORRECTED ALIAS
            v_cursor_conditions := array_append(v_cursor_conditions,
                format('(mcp.created_at > %L OR (mcp.created_at = %L AND mcp.id > %s))', -- CORRECTED ALIAS
                       p_after_created_at, p_after_created_at, p_after_id)
            );
        ELSIF p_before_created_at IS NOT NULL AND p_before_id IS NOT NULL THEN
            v_order_by := 'ORDER BY mcp.created_at DESC, mcp.id DESC'; -- CORRECTED ALIAS
            v_cursor_conditions := array_append(v_cursor_conditions,
                format('(mcp.created_at < %L OR (mcp.created_at = %L AND mcp.id < %s))', -- CORRECTED ALIAS
                       p_before_created_at, p_before_created_at, p_before_id)
            );
        ELSE
             v_order_by := 'ORDER BY mcp.created_at ASC, mcp.id ASC'; -- CORRECTED ALIAS
        END IF;

        IF array_length(v_cursor_conditions, 1) > 0 THEN
            IF v_final_where_clause = '' THEN
                v_final_where_clause := 'WHERE ' || array_to_string(v_cursor_conditions, ' AND ');
            ELSE
                v_final_where_clause := v_final_where_clause || ' AND (' || array_to_string(v_cursor_conditions, ' AND ') || ')';
            END IF;
        END IF;
        
        v_data_query := format('SELECT %s %s %s %s %s LIMIT %s',
                                 v_select_list, v_base_from_joins, v_final_where_clause, v_group_by_sql, v_order_by, v_effective_limit);
    END IF;

    -- Execute data query and build JSON array
    DECLARE
        temp_table_name TEXT := 'paginated_data_temp_' || replace(gen_random_uuid()::text, '-', '');
    BEGIN
        RAISE NOTICE 'Executing data query for temp table: %', v_data_query;
        EXECUTE format('CREATE TEMP TABLE %I ON COMMIT DROP AS %s', temp_table_name, v_data_query);
        EXECUTE format('SELECT count(*) FROM %I', temp_table_name) INTO v_actual_fetched_count;
        
        -- The fields in the temp table are mcp_id, package_name, created_at, etc.
        -- The json_agg should order by the temp table's created_at and mcp_id (or whatever mcp.id was aliased to)
        IF p_page IS NOT NULL AND p_page > 0 THEN 
             EXECUTE format(
                'SELECT COALESCE(json_agg(t.* ORDER BY t.created_at ASC, t.mcp_id ASC), ''[]''::JSON) FROM (SELECT * FROM %I) t',
                 temp_table_name
            ) INTO v_fetched_rows;
        ELSIF p_before_created_at IS NOT NULL THEN 
             EXECUTE format(
                'SELECT COALESCE(json_agg(sub.* ORDER BY sub.created_at ASC, sub.mcp_id ASC), ''[]''::JSON)
                 FROM (
                     SELECT * FROM %I 
                     LIMIT %L 
                 ) sub',
                temp_table_name, p_limit 
            ) INTO v_fetched_rows;
        ELSE 
            EXECUTE format(
                'SELECT COALESCE(json_agg(t.* ORDER BY t.created_at ASC, t.mcp_id ASC), ''[]''::JSON) FROM (SELECT * FROM %I LIMIT %L) t',
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
        RAISE WARNING 'Error in get_mcp_paginated_json: % - Query: %', SQLERRM, COALESCE(v_data_query, 'Query not yet constructed');
        RETURN json_build_object(
            'data', '[]'::JSON,
            'totalCount', 0,
            'actual_fetched_count', 0,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql VOLATILE;