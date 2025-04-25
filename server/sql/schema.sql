DROP TABLE IF EXISTS cs_department CASCADE;
CREATE TABLE cs_department (
    department_id BIGSERIAL PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL UNIQUE,
    department_description TEXT,
    department_is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at_utc TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
)

DROP TABLE IF EXISTS cs_positions CASCADE;
CREATE TABLE cs_positions (
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
CREATE TABLE cs_employees (
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
CREATE INDEX idx_employee_code ON cs_employees(employee_code);

DROP TABLE IF EXISTS cs_user_auth CASCADE;
CREATE TABLE cs_user_auth (
    user_id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at_utc TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at_utc TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (employee_id) REFERENCES cs_employees(employee_id) ON DELETE CASCADE ON UPDATE CASCADE
);