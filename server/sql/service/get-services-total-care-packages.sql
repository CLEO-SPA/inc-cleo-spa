CREATE OR REPLACE FUNCTION get_total_care_packages(p_service_id BIGINT)
RETURNS INT AS $$
DECLARE
    total_care_packages INT;
BEGIN
	SELECT COUNT(*)
	INTO total_care_packages
	FROM care_package_item_details
	WHERE service_id = p_service_id;

	RETURN total_care_packages;
END;
$$ LANGUAGE plpgsql;