CREATE OR REPLACE FUNCTION get_mcp_by_id(p_package_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    result_json JSONB;
BEGIN
    SELECT
        jsonb_build_object(
            'package', jsonb_build_object(
                'id', mcp.id,
                'member_id', mcp.member_id,
                'employee_id', mcp.employee_id,
                'package_name', mcp.package_name,
                'status_id', mcp.status_id,
                'total_price', mcp.total_price,
                'balance', mcp.balance,
                'created_at', mcp.created_at,
                'updated_at', mcp.updated_at,
                'package_remarks', mcp.package_remarks
            ),
            'details', COALESCE(
                jsonb_agg(
                    DISTINCT jsonb_build_object(
                        'id', mcpd.id,
                        'service_name', mcpd.service_name,
                        'discount', mcpd.discount,
                        'price', mcpd.price,
                        'member_care_package_id', mcpd.member_care_package_id,
                        'service_id', mcpd.service_id,
                        'status_id', mcpd.status_id,
                        'quantity', mcpd.quantity
                    )
                ) FILTER (WHERE mcpd.id IS NOT NULL),
                '[]'::jsonb
            ),
            'transactionLogs', COALESCE(
                ( 
                    SELECT
                        jsonb_agg(
                            jsonb_build_object(
                                'id', mcptl.id,
                                'type', mcptl.type,
                                'description', mcptl.description,
                                'transaction_date', mcptl.transaction_date,
                                'transaction_amount', mcptl.transaction_amount,
                                'amount_changed', mcptl.amount_changed,
                                'created_at', mcptl.created_at,
                                'member_care_package_details_id', mcptl.member_care_package_details_id,
                                'employee_id', mcptl.employee_id,
                                'service_id', mcptl.service_id
                            ) ORDER BY mcptl.transaction_date DESC
                        )
                    FROM
                        "member_care_package_details" mcpd_sub
                    JOIN
                        "member_care_package_transaction_logs" mcptl ON mcpd_sub.id = mcptl.member_care_package_details_id
                    WHERE
                        mcpd_sub.member_care_package_id = mcp.id
                ),
                '[]'::jsonb
            )
        )
    INTO result_json
    FROM
        "member_care_packages" mcp
    LEFT JOIN
        "member_care_package_details" mcpd ON mcp.id = mcpd.member_care_package_id
    WHERE
        mcp.id = p_package_id
    GROUP BY
        mcp.id;

    RETURN result_json;
END;
$$;