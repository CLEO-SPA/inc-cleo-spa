DROP FUNCTION IF EXISTS get_products_with_pagination(integer,integer,text,bigint,boolean);

CREATE OR REPLACE FUNCTION get_products_with_pagination(
    p_page INT DEFAULT 1,
    p_page_size INT DEFAULT 10,
    p_search TEXT DEFAULT NULL,
    p_category BIGINT DEFAULT NULL,
    p_status BOOLEAN DEFAULT NULL
)
RETURNS TABLE (
    id BIGINT,
    product_name character varying(255),
    product_description character varying(255),
    product_remarks TEXT,
    product_unit_sale_price NUMERIC (10,2),
    product_unit_cost_price NUMERIC (10,2),
    product_is_enabled BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
	created_by character varying(255),
    updated_by character varying(255),
    product_category_id BIGINT,
	product_category_name character varying(255),
    product_sequence_no INT
)
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.product_name,
        p.product_description,
        p.product_remarks,
        p.product_unit_sale_price,
        p.product_unit_cost_price,
        p.product_is_enabled,
        p.created_at,
        p.updated_at,
        em_c.employee_name AS created_by,
        em_u.employee_name AS updated_by,
        p.product_category_id,
		pc.product_category_name,
        p.product_sequence_no
    FROM products AS p
    LEFT JOIN product_categories AS pc ON p.product_category_id = pc.id
    INNER JOIN employees AS em_c ON p.created_by = em_c.id
    INNER JOIN employees AS em_u ON p.updated_by = em_u.id
    WHERE 
        (p_search IS NULL OR p.product_name ILIKE '%' || p_search || '%') AND
        (p_category IS NULL OR p.product_category_id = p_category) AND
        (p_status IS NULL OR p.product_is_enabled = p_status)
    ORDER BY pc.product_category_sequence_no,
        CASE 
            WHEN p.product_sequence_no = 0 THEN 1
            ELSE 0
        END,
        p.product_sequence_no
    LIMIT p_page_size
    OFFSET (p_page - 1) * p_page_size;
END;
$$ LANGUAGE plpgsql;