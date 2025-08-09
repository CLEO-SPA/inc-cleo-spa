-- DROP FUNCTION get_services_with_pagination(integer,integer,text,bigint,boolean) IF EXISTS;

CREATE OR REPLACE FUNCTION get_services_with_pagination(
    p_page INT DEFAULT 1,
    p_page_size INT DEFAULT 10,
    p_search TEXT DEFAULT NULL,
    p_category BIGINT DEFAULT NULL,
    p_status BOOLEAN DEFAULT NULL
)
RETURNS TABLE (
    id BIGINT,
    service_name character varying(255),
    service_description character varying(255),
    service_remarks TEXT,
    service_duration NUMERIC,
    service_price NUMERIC (10,2),
    service_is_enabled BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
	created_by character varying(255),
    updated_by character varying(255),
    service_category_id BIGINT,
    service_sequence_no INT,
    service_category_name character varying(255),
	total_sale_transactions INT,
	total_care_packages INT
)
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id, s.service_name, s.service_description, s.service_remarks,
        s.service_duration, s.service_price, s.service_is_enabled,
        s.created_at, s.updated_at,
		em_c.employee_name AS created_by, em_u.employee_name AS updated_by,
		s.service_category_id, s.service_sequence_no, sc.service_category_name,
		get_total_sale_transactions(s.service_name) AS total_sale_transactions,
		get_total_care_packages(s.id) AS total_care_packages
    FROM services AS s
    LEFT JOIN service_categories AS sc ON s.service_category_id = sc.id
	INNER JOIN employees AS em_c ON s.created_by = em_c.id
	INNER JOIN employees AS em_u ON s.updated_by = em_u.id
    WHERE 
        (p_search IS NULL OR s.service_name ILIKE '%' || p_search || '%') AND
        (p_category IS NULL OR s.service_category_id = p_category) AND
        (p_status IS NULL OR s.service_is_enabled = p_status)
    ORDER BY sc.service_category_sequence_no,
	CASE 
        WHEN s.service_sequence_no = 0 THEN 1
        ELSE 0
    END,
	s.service_sequence_no
    LIMIT p_page_size
    OFFSET (p_page - 1) * p_page_size;
END;$$ LANGUAGE plpgsql;