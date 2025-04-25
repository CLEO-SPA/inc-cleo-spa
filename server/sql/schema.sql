DROP TABLE IF EXISTS cs_status CASCADE;
CREATE TABLE IF NOT EXISTS cs_status (
    status_id BIGSERIAL PRIMARY KEY,
    status_name VARCHAR(50) NOT NULL UNIQUE,
    status_description TEXT,
    created_at_utc TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS cs_department CASCADE;
CREATE TABLE IF NOT EXISTS cs_department (
    department_id BIGSERIAL PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL UNIQUE,
    department_description TEXT,
    department_is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at_utc TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS cs_positions CASCADE;
CREATE TABLE IF NOT EXISTS cs_positions (
    position_id BIGSERIAL PRIMARY KEY,
    position_name VARCHAR(100) NOT NULL UNIQUE,
    position_description TEXT,
    position_is_active BOOLEAN NOT NULL DEFAULT TRUE,
    default_commission_percentage DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    department_id BIGINT NOT NULL,
    created_at_utc TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at_utc TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (department_id) REFERENCES cs_department(department_id) ON DELETE CASCADE ON UPDATE CASCADE
);

DROP TABLE IF EXISTS cs_employees CASCADE;
CREATE TABLE IF NOT EXISTS cs_employees (
    employee_id BIGSERIAL PRIMARY KEY,
    employee_code VARCHAR(50) NOT NULL UNIQUE,
    department_id BIGINT NOT NULL,
    employee_name VARCHAR(100) NOT NULL,
    employee_contact VARCHAR(10) NOT NULL UNIQUE,
    employee_email VARCHAR(100) NOT NULL UNIQUE,
    employee_is_active BOOLEAN NOT NULL DEFAULT TRUE,
    position_id BIGINT NOT NULL,
    commission_percentage DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_at_utc TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at_utc TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (department_id) REFERENCES cs_department(department_id),
    FOREIGN KEY (position_id) REFERENCES cs_positions(position_id)
);

DROP INDEX IF EXISTS idx_employee_code CASCADE;
CREATE INDEX IF NOT EXISTS idx_employee_code ON cs_employees(employee_code);

DROP TABLE IF EXISTS cs_members CASCADE;
CREATE TABLE IF NOT EXISTS cs_members (
    member_id BIGSERIAL PRIMARY KEY,
    member_name VARCHAR(100) NOT NULL,
    member_email VARCHAR(100) NOT NULL UNIQUE,
    member_contact VARCHAR(10) NOT NULL UNIQUE,
    member_dob DATE NOT NULL,
    remarks TEXT,
    created_at_utc TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at_utc TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS cs_membership_types CASCADE;
CREATE TABLE IF NOT EXISTS cs_membership_types (
    membership_type_id BIGSERIAL PRIMARY KEY,
    membership_type_name VARCHAR(50) NOT NULL,
    default_discount_for_products INT NOT NULL DEFAULT 0,
    default_discount_percentage_for_service DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    account_stored_value_top_up_performance_rule_id BIGINT,
    account_stored_value_top_up_commission_rule_id BIGINT,
    account_creation_performance_rule_id BIGINT,
    default_stored_value INT NOT NULL DEFAULT 0,
    account_creation_commission_rule_id BIGINT,
    created_at_utc TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at_utc TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
)

DROP TABLE IF EXISTS cs_membership_accounts CASCADE;
CREATE TABLE IF NOT EXISTS cs_membership_accounts (
    membership_account_id BIGSERIAL PRIMARY KEY,
    member_id BIGINT NOT NULL,
    membership_type_id BIGINT NOT NULL,
    membership_account_start_date TIMESTAMPTZ NOT NULL,
    membership_account_end_date TIMESTAMPTZ NOT NULL,
    status_id BIGINT NOT NULL,
    created_at_utc TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at_utc TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (member_id) REFERENCES cs_members(member_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (membership_type_id) REFERENCES cs_membership_types(membership_type_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (status_id) REFERENCES cs_status(status_id) ON DELETE CASCADE ON UPDATE CASCADE
);

DROP TABLE IF EXISTS cs_user_auth CASCADE;
CREATE TABLE IF NOT EXISTS cs_user_auth (
    user_id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at_utc TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at_utc TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (employee_id) REFERENCES cs_employees(employee_id) ON DELETE CASCADE ON UPDATE CASCADE
);

DROP TABLE IF EXISTS cs_permissions CASCADE;
CREATE TABLE IF NOT EXISTS cs_permissions (
    permission_id BIGSERIAL PRIMARY KEY,
    read_access BOOLEAN NOT NULL DEFAULT FALSE,
    create_access BOOLEAN NOT NULL DEFAULT FALSE,
    delete_access BOOLEAN NOT NULL DEFAULT FALSE,
    update_access BOOLEAN NOT NULL DEFAULT FALSE
);

DROP TABLE IF EXISTS cs_roles CASCADE;
CREATE TABLE IF NOT EXISTS cs_roles (
    role_id BIGSERIAL PRIMARY KEY,
    role_name VARCHAR(100) NOT NULL UNIQUE,
    role_description TEXT,
    created_at_utc TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at_utc TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS cs_role_permission CASCADE;
CREATE TABLE IF NOT EXISTS cs_role_permission (
    role_permission_id BIGSERIAL PRIMARY KEY,
    role_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,

    FOREIGN KEY (role_id) REFERENCES cs_roles(role_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES cs_permissions(permission_id) ON DELETE CASCADE ON UPDATE CASCADE
);

DROP TABLE IF EXISTS cs_user_role CASCADE;
CREATE TABLE IF NOT EXISTS cs_user_role (
    user_role_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,

    FOREIGN KEY (user_id) REFERENCES cs_user_auth(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (role_id) REFERENCES cs_roles(role_id) ON DELETE CASCADE ON UPDATE CASCADE
);

DROP TABLE IF EXISTS cs_service_categories CASCADE;
CREATE TABLE IF NOT EXISTS cs_service_categories (
    service_category_id BIGSERIAL PRIMARY KEY,
    service_category_name VARCHAR(255) NOT NULL UNIQUE,
    service_category_description TEXT,
    service_category_sequence_no INT NOT NULL DEFAULT 0,
    created_at_utc TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at_utc TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS cs_services CASCADE;
CREATE TABLE IF NOT EXISTS cs_services (
    service_id BIGSERIAL PRIMARY KEY,
    service_name VARCHAR(255) NOT NULL,
    service_description TEXT,
    service_remarks TEXT,
    service_estimated_duration INT NOT NULL,
    service_default_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    service_is_active BOOLEAN NOT NULL DEFAULT TRUE,
    service_category_id BIGINT NOT NULL,
    service_sequence_no INT NOT NULL DEFAULT 0,
    created_at_utc TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at_utc TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (service_category_id) REFERENCES cs_service_categories(service_category_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- TODO: care_package_customizable is not final
DROP TABLE IF EXISTS cs_care_package CASCADE;
CREATE TABLE IF NOT EXISTS cs_care_package (
    care_package_id BIGSERIAL PRIMARY KEY,
    care_package_name VARCHAR(255) NOT NULL,
    care_package_remarks TEXT,
    care_package_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    care_package_customizable BOOLEAN NOT NULL DEFAULT FALSE,
    status_id BIGINT NOT NULL,
    created_at_utc TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at_utc TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (status_id) REFERENCES cs_status(status_id) ON DELETE CASCADE ON UPDATE CASCADE
);

DROP TABLE IF EXISTS cs_care_package_items CASCADE;
CREATE TABLE IF NOT EXISTS cs_care_package_items (
    care_package_item_id BIGSERIAL PRIMARY KEY,
    care_package_id BIGINT NOT NULL,
    created_at_utc TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at_utc TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (care_package_id) REFERENCES cs_care_package(care_package_id) ON DELETE CASCADE ON UPDATE CASCADE
);

DROP TABLE IF EXISTS cs_care_package_item_details CASCADE;
CREATE TABLE IF NOT EXISTS cs_care_package_item_details (
    care_package_item_detail_id BIGSERIAL PRIMARY KEY,
    care_package_item_id BIGINT NOT NULL,
    care_package_item_detail_quantity INT NOT NULL DEFAULT 1,
    care_package_item_detail_discount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    care_package_item_detail_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    service_id BIGINT NOT NULL,

    FOREIGN KEY (care_package_item_id) REFERENCES cs_care_package_items(care_package_item_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (service_id) REFERENCES cs_services(service_id) ON DELETE CASCADE ON UPDATE CASCADE
);

DROP TABLE IF EXISTS cs_member_care_package CASCADE;
CREATE TABLE IF NOT EXISTS cs_member_care_package (
    member_care_package_id BIGSERIAL PRIMARY KEY,
    member_id BIGINT NOT NULL,
    employee_id BIGINT NOT NULL,
    care_package_name VARCHAR(100) NOT NULL,
    member_care_package_status BIGINT NOT NULL,
    member_care_package_total_amount DECIMAL(10,2) NOT NULL,
    remarks TEXT,
    created_at_utc TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at_utc TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (member_id) REFERENCES cs_members(member_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES cs_employees(employee_id) ON DELETE CASCADE ON UPDATE CASCADE
);

DROP TABLE IF EXISTS cs_member_care_package_details CASCADE;
CREATE TABLE IF NOT EXISTS cs_member_care_package_details (
    member_care_package_details_id BIGSERIAL PRIMARY KEY,
    member_care_package_details_discount DECIMAL(10,2) NOT NULL,
    member_care_package_details_price DECIMAL(10,2) NOT NULL,
    member_care_package_id BIGINT NOT NULL,
    service_id BIGINT NOT NULL,
    status_id BIGINT NOT NULL,

    FOREIGN KEY (member_care_package_id) REFERENCES cs_member_care_package(member_care_package_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (service_id) REFERENCES cs_services(service_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (status_id) REFERENCES cs_status(status_id) ON DELETE CASCADE ON UPDATE CASCADE
);

DROP TABLE IF EXISTS cs_member_care_package_item_logs CASCADE;
CREATE TABLE IF NOT EXISTS cs_member_care_package_item_logs (
    member_care_package_item_logs_id BIGSERIAL PRIMARY KEY,
    member_care_package_item_logs_type VARCHAR(100) NOT NULL,
    member_care_package_item_logs_description TEXT,
    member_care_package_details_id BIGINT NOT NULL,
    status_id BIGINT NOT NULL,
    created_at_utc TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (member_care_package_details_id) REFERENCES cs_member_care_package_details(member_care_package_details_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (status_id) REFERENCES cs_status(status_id) ON DELETE CASCADE ON UPDATE CASCADE
);