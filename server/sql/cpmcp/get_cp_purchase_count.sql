CREATE OR REPLACE FUNCTION get_cp_purchase_counts()
RETURNS TABLE (
    id bigint,
    care_package_name character varying,
    purchase_count bigint,
    is_purchased text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cp.id,
        cp.care_package_name,
        COUNT(mcp.id) AS purchase_count,
        CASE 
            WHEN COUNT(mcp.id) > 0 THEN 'Yes'
            ELSE 'No'
        END AS is_purchased
    FROM public.care_packages cp
    LEFT JOIN public.member_care_packages mcp 
        ON cp.care_package_name = mcp.package_name
    GROUP BY 
        cp.id,
        cp.care_package_name
    ORDER BY 
        purchase_count DESC,
        cp.care_package_name;
END;
$$ LANGUAGE plpgsql;