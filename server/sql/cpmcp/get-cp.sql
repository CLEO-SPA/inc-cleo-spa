CREATE OR REPLACE FUNCTION get_cp_by_id(p_care_package_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    result_json JSONB;
BEGIN
    SELECT
        jsonb_build_object(
            'package', jsonb_build_object(
                'id', cp.id,
                'care_package_name', cp.care_package_name,
                'care_package_remarks', cp.care_package_remarks,
                'care_package_price', cp.care_package_price,
                'created_at', cp.created_at,
                'updated_at', cp.updated_at,
                'care_package_customizable', cp.care_package_customizable,
                'status', cp.status,
                'created_by', cp.created_by,
                'last_updated_by', cp.last_updated_by
            ),
            'details', COALESCE(
                jsonb_agg(
                    jsonb_build_object(
                        'id', cpid.id,
                        'care_package_item_details_quantity', cpid.care_package_item_details_quantity,
                        'care_package_item_details_discount', cpid.care_package_item_details_discount,
                        'care_package_item_details_price', cpid.care_package_item_details_price,
                        'service_id', cpid.service_id,
                        'care_package_id', cpid.care_package_id
                    ) ORDER BY cpid.id
                ) FILTER (WHERE cpid.id IS NOT NULL),
                '[]'::jsonb
            )
        )
    INTO result_json
    FROM
        "care_packages" cp
    LEFT JOIN
        "care_package_item_details" cpid ON cp.id = cpid.care_package_id
    WHERE
        cp.id = p_care_package_id
    GROUP BY
        cp.id;

    RETURN result_json;
END;
$$;