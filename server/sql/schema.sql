-- Drop Tables
DROP TABLE IF EXISTS "care_packages" CASCADE;
DROP TABLE IF EXISTS "care_package_item_details" CASCADE;
DROP TABLE IF EXISTS "employees" CASCADE;
DROP TABLE IF EXISTS "employee_commissions" CASCADE;
DROP TABLE IF EXISTS "refund_items" CASCADE;
DROP TABLE IF EXISTS "member_care_packages" CASCADE;
DROP TABLE IF EXISTS "member_care_package_details" CASCADE;
DROP TABLE IF EXISTS "statuses" CASCADE;
DROP TABLE IF EXISTS "member_care_package_transaction_logs" CASCADE;
DROP TABLE IF EXISTS "members" CASCADE;
DROP TABLE IF EXISTS "membership_accounts" CASCADE;
DROP TABLE IF EXISTS "membership_types" CASCADE;
DROP TABLE IF EXISTS "payment_methods" CASCADE;
DROP TABLE IF EXISTS "positions" CASCADE;
DROP TABLE IF EXISTS "employee_to_position" CASCADE;
DROP TABLE IF EXISTS "product_categories" CASCADE;
DROP TABLE IF EXISTS "products" CASCADE;
DROP TABLE IF EXISTS "roles" CASCADE;
DROP TABLE IF EXISTS "services" CASCADE;
DROP TABLE IF EXISTS "service_categories" CASCADE;
DROP TABLE IF EXISTS "translations" CASCADE;
DROP TABLE IF EXISTS "user_to_role" CASCADE;
DROP TABLE IF EXISTS "appointments" CASCADE;
DROP TABLE IF EXISTS "member_voucher_details" CASCADE;
DROP TABLE IF EXISTS "member_voucher_transaction_logs" CASCADE;
DROP TABLE IF EXISTS "member_vouchers" CASCADE;
DROP TABLE IF EXISTS "payment_to_sale_transactions" CASCADE;
DROP TABLE IF EXISTS "sale_transaction_items" CASCADE;
DROP TABLE IF EXISTS "sale_transactions" CASCADE;
DROP TABLE IF EXISTS "timetables" CASCADE;
DROP TABLE IF EXISTS "voucher_template_details" CASCADE;
DROP TABLE IF EXISTS "voucher_templates" CASCADE;
DROP TABLE IF EXISTS "system_parameters" CASCADE;
DROP TABLE IF EXISTS "sessions" CASCADE;
DROP TABLE IF EXISTS "user_auth" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TABLE IF EXISTS "settings" CASCADE;
DROP TABLE IF EXISTS "stored_value_accounts" CASCADE;
DROP TABLE IF EXISTS "stored_value_accounts_transaction_logs" CASCADE;

-- Drop Enums
DROP TYPE IF EXISTS "customer_type" CASCADE;
DROP TYPE IF EXISTS "item_type" CASCADE;
DROP TYPE IF EXISTS "customer_type_enum" CASCADE;

-- CreateEnum
CREATE TYPE "customer_type" AS ENUM ('Member', 'Walk_In_Customer');

-- CreateEnum
CREATE TYPE "item_type" AS ENUM ('Product', 'Service', 'Member_Care_Package', 'Membership_Account', 'Member Voucher');

-- CreateEnum
CREATE TYPE "customer_type_enum" AS ENUM ('member', 'walk-in-customer');

-- CreateTable
CREATE TABLE "care_packages" (
    "id" BIGSERIAL NOT NULL,
    "care_package_name" VARCHAR(200) NOT NULL,
    "care_package_remarks" TEXT,
    "care_package_price" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "care_package_customizable" BOOLEAN NOT NULL DEFAULT false,
    "status" VARCHAR(50) NOT NULL,
    "created_by" BIGINT,
    "last_updated_by" BIGINT,

    CONSTRAINT "care_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "care_package_item_details" (
    "id" BIGSERIAL NOT NULL,
    "care_package_item_details_quantity" INTEGER NOT NULL,
    "care_package_item_details_discount" DECIMAL(10,2) NOT NULL,
    "care_package_item_details_price" DECIMAL(10,2) NOT NULL,
    "service_id" BIGINT NOT NULL,
    "care_package_id" BIGINT NOT NULL,

    CONSTRAINT "care_package_item_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" BIGSERIAL NOT NULL,
    "employee_code" VARCHAR(50) NOT NULL,
    "employee_contact" VARCHAR(20) NOT NULL,
    "employee_email" VARCHAR(255) NOT NULL,
    "employee_is_active" BOOLEAN NOT NULL,
    "employee_name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_to_position" (
    "id" BIGSERIAL NOT NULL,
    "employee_id" BIGINT NOT NULL,
    "position_id" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "employee_to_position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_care_packages" (
    "id" BIGSERIAL NOT NULL,
    "member_id" BIGINT NOT NULL,
    "employee_id" BIGINT NOT NULL,
    "package_name" VARCHAR(100) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "total_price" DECIMAL(10,2) NOT NULL,
    "balance" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "package_remarks" VARCHAR(255),

    CONSTRAINT "member_care_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_care_package_details" (
    "id" BIGSERIAL NOT NULL,
    "service_name" VARCHAR(100) NOT NULL,
    "discount" DECIMAL(10,2) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "member_care_package_id" BIGINT NOT NULL,
    "service_id" BIGINT,
    "status" VARCHAR(50) NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "member_care_package_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "statuses" (
    "id" BIGSERIAL NOT NULL,
    "status_name" VARCHAR(50) NOT NULL,
    "status_description" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_care_package_transaction_logs" (
    "id" BIGSERIAL NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "transaction_date" TIMESTAMPTZ(6) NOT NULL,
    "transaction_amount" DECIMAL(10,2) NOT NULL,
    "amount_changed" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "member_care_package_details_id" BIGINT NOT NULL,
    "employee_id" BIGINT NOT NULL,
    "service_id" BIGINT,

    CONSTRAINT "member_care_package_transaction_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "members" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100),
    "contact" VARCHAR(20),
    "dob" DATE,
    "sex" VARCHAR(10),
    "remarks" VARCHAR(255),
    "address" VARCHAR(255),
    "nric" VARCHAR(9),
    "membership_type_id" INTEGER,
    "card_number" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    "created_by" INTEGER,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership_accounts" (
    "id" BIGSERIAL NOT NULL,
    "member_id" BIGINT NOT NULL,
    "membership_type_id" BIGINT NOT NULL,
    "start_date" TIMESTAMP(6) NOT NULL,
    "end_date" TIMESTAMP(6),
    "is_active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "status_id" BIGINT NOT NULL,

    CONSTRAINT "cs_membership_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership_types" (
    "id" BIGSERIAL NOT NULL,
    "membership_type_name" VARCHAR(50) NOT NULL,
    "default_percentage_discount_for_products" DECIMAL,
    "default_percentage_discount_for_services" DECIMAL,
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    "created_by" BIGINT NOT NULL,
    "last_updated_by" BIGINT NOT NULL,

    CONSTRAINT "membership_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_methods" (
    "id" BIGINT NOT NULL,
    "payment_method_name" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL,
    "is_income" BOOLEAN NOT NULL,
    "show_on_payment_page" BOOLEAN NOT NULL DEFAULT true,
    "is_protected" BOOLEAN NOT NULL DEFAULT false,
    "percentage_rate" DECIMAL(5,2),
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "positions" (
    "id" BIGSERIAL NOT NULL,
    "position_name" VARCHAR(255) NOT NULL,
    "position_description" VARCHAR(255),
    "position_is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_categories" (
    "id" BIGSERIAL NOT NULL,
    "product_category_name" VARCHAR(255) NOT NULL,
    "product_category_sequence_no" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" BIGSERIAL NOT NULL,
    "product_name" VARCHAR(255) NOT NULL,
    "product_description" VARCHAR(255),
    "product_sequence_no" INTEGER,
    "product_remarks" TEXT,
    "product_unit_sale_price" DECIMAL(10,2) NOT NULL,
    "product_unit_cost_price" DECIMAL(10,2) NOT NULL,
    "product_is_enabled" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "product_category_id" BIGINT NOT NULL,
    "created_by" BIGINT NOT NULL,
    "updated_by" BIGINT NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" BIGSERIAL NOT NULL,
    "role_name" VARCHAR(20) NOT NULL,
    "description" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" BIGSERIAL NOT NULL,
    "service_name" VARCHAR(255) NOT NULL,
    "service_description" VARCHAR(255),
    "service_remarks" TEXT,
    "service_duration" DECIMAL NOT NULL,
    "service_price" DECIMAL(10,2) NOT NULL,
    "service_is_enabled" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "service_category_id" BIGINT NOT NULL,
    "service_sequence_no" INTEGER NOT NULL,
    "created_by" BIGINT,
    "updated_by" BIGINT,

    CONSTRAINT "cs_service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_categories" (
    "id" BIGSERIAL NOT NULL,
    "service_category_name" VARCHAR(255) NOT NULL,
    "service_category_sequence_no" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "service_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "translations" (
    "id" SERIAL NOT NULL,
    "english" VARCHAR(255) NOT NULL,
    "chinese" VARCHAR(255) NOT NULL,
    "meaning_in_english" VARCHAR(255) NOT NULL,
    "meaning_in_chinese" VARCHAR(255) NOT NULL,
    "page" VARCHAR(255),
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_to_role" (
    "id" BIGSERIAL NOT NULL,
    "user_auth_id" BIGINT NOT NULL,
    "role_id" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_to_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" BIGSERIAL NOT NULL,
    "member_id" BIGINT,
    "servicing_employee_id" BIGINT,
    "appointment_date" TIMESTAMPTZ(6),
    "start_time" TIMESTAMPTZ(6),
    "end_time" TIMESTAMPTZ(6),
    "remarks" TEXT,
    "created_at" TIMESTAMPTZ(6),
    "created_by" BIGINT,
    "updated_at" TIMESTAMPTZ(6),
    "updated_by" BIGINT,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_voucher_details" (
    "id" BIGSERIAL NOT NULL,
    "member_voucher_id" BIGINT NOT NULL,
    "service_id" INTEGER NOT NULL,
    "service_name" VARCHAR(100),
    "original_price" DECIMAL(10,2),
    "custom_price" DECIMAL(10,2),
    "discount" DECIMAL(10,2),
    "final_price" DECIMAL(10,2),
    "duration" INTEGER,
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "member_voucher_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_voucher_transaction_logs" (
    "id" SERIAL NOT NULL,
    "member_voucher_id" INTEGER NOT NULL,
    "service_description" VARCHAR(500),
    "service_date" TIMESTAMPTZ(6),
    "current_balance" DECIMAL(10,2),
    "amount_change" DECIMAL,
    "serviced_by" BIGINT,
    "type" VARCHAR(25),
    "created_by" BIGINT,
    "last_updated_by" BIGINT,
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "member_voucher_transaction_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_vouchers" (
    "id" BIGINT NOT NULL,
    "member_vouchers_name" VARCHAR(100) NOT NULL,
    "voucher_template_id" INTEGER NOT NULL,
    "member_id" INTEGER NOT NULL,
    "current_balance" DECIMAL(10,2),
    "starting_balance" DECIMAL(10,2),
    "free_of_charge" DECIMAL(10,2),
    "default_total_price" DECIMAL(10,2),
    "status" VARCHAR(50),
    "remarks" VARCHAR(500),
    "created_by" BIGINT,
    "handled_by" BIGINT,
    "last_updated_by" BIGINT,
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "member_vouchers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_to_sale_transactions" (
    "id" INTEGER NOT NULL,
    "payment_method_id" INTEGER,
    "sale_transaction_id" INTEGER,
    "amount" DECIMAL(10,2),
    "remarks" TEXT,
    "created_by" INTEGER,
    "created_at" TIMESTAMPTZ(6),
    "updated_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "payment_to_sale_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_transaction_items" (
    "id" INTEGER NOT NULL,
    "sale_transaction_id" INTEGER,
    "service_name" VARCHAR(255),
    "product_name" VARCHAR(255),
    "member_care_package_id" BIGINT,
    "member_voucher_id" BIGINT,
    "original_unit_price" DECIMAL(10,2),
    "custom_unit_price" DECIMAL(10,2),
    "discount_percentage" DECIMAL(5,2),
    "quantity" INTEGER,
    "remarks" VARCHAR(500),
    "amount" DECIMAL(10,2),
    "item_type" VARCHAR(255),

    CONSTRAINT "sale_transaction_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_transactions" (
    "id" BIGSERIAL NOT NULL,
    "customer_type" VARCHAR(50),
    "member_id" BIGINT,
    "total_paid_amount" DECIMAL,
    "outstanding_total_payment_amount" DECIMAL,
    "sale_transaction_status" VARCHAR(25),
    "remarks" VARCHAR(500),
    "receipt_no" VARCHAR(80),
    "reference_sales_transaction_id" BIGINT,
    "handled_by" BIGINT,
    "created_by" BIGINT,
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "sale_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timetables" (
    "id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "restday_number" INTEGER NOT NULL,
    "effective_startdate" TIMESTAMP(6) NOT NULL,
    "effective_enddate" TIMESTAMP(6),
    "created_by" INTEGER,
    "created_at" TIMESTAMP(6),
    "updated_by" INTEGER,
    "updated_at" TIMESTAMP(6),

    CONSTRAINT "timetables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voucher_template_details" (
    "id" BIGSERIAL NOT NULL,
    "voucher_template_id" BIGINT NOT NULL,
    "service_id" BIGINT NOT NULL,
    "service_name" VARCHAR(100) NOT NULL,
    "original_price" DECIMAL(10,2) NOT NULL,
    "custom_price" DECIMAL(10,2) NOT NULL,
    "discount" DECIMAL(10,2) NOT NULL,
    "final_price" DECIMAL(10,2) NOT NULL,
    "duration" INTEGER NOT NULL,
    "service_category_id" INTEGER,

    CONSTRAINT "voucher_template_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voucher_templates" (
    "id" BIGSERIAL NOT NULL,
    "voucher_template_name" VARCHAR(100) NOT NULL,
    "default_starting_balance" DECIMAL(10,2),
    "default_free_of_charge" DECIMAL(10,2),
    "default_total_price" DECIMAL(10,2),
    "remarks" VARCHAR(500),
    "status" VARCHAR(50),
    "created_by" BIGINT,
    "last_updated_by" BIGINT,
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "voucher_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_parameters" (
    "id" BIGSERIAL NOT NULL,
    "start_date_utc" TIMESTAMP(6),
    "end_date_utc" TIMESTAMP(6),
    "is_simulation" BOOLEAN NOT NULL,

    CONSTRAINT "system_parameters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "verified_status_id" BIGINT NOT NULL,
    "user_auth_id" BIGINT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_auth" (
    "id" BIGSERIAL NOT NULL,
    "password" VARCHAR(72),
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "email" VARCHAR(50),

    CONSTRAINT "user_auth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_commissions" (
    "id" BIGSERIAL NOT NULL,
    "item_type" VARCHAR(100) NOT NULL,
    "item_id" BIGINT NOT NULL,
    "employee_id" BIGINT NOT NULL,
    "performance_rate" DECIMAL(5,2) NOT NULL,
    "performance_amount" DECIMAL(10,2) NOT NULL,
    "commission_rate" DECIMAL(5,2) NOT NULL,
    "commission_amount" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "remarks" TEXT,

    CONSTRAINT "employee_commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" BIGSERIAL NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stored_value_accounts" (
    "id" BIGSERIAL NOT NULL,
    "member_id" BIGINT NOT NULL,
    "stored_value" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "created_by" BIGINT NOT NULL,
    "last_updated_by" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "stored_value_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stored_value_accounts_transaction_logs" (
    "id" BIGSERIAL NOT NULL,
    "stored_value_account_id" BIGINT NOT NULL,
    "stored_value" DECIMAL(10,2) NOT NULL,
    "amount_changed" DECIMAL(10,2) NOT NULL,
    "transaction_date" TIMESTAMPTZ(6) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "created_by" BIGINT NOT NULL,
    "last_updated_by" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "stored_value_accounts_transaction_logs_pkey" PRIMARY KEY ("id")
);

-- Foreign Keys for table "care_packages"
ALTER TABLE "care_packages" ADD CONSTRAINT "care_packages_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "care_packages" ADD CONSTRAINT "care_packages_last_updated_by_fkey" FOREIGN KEY ("last_updated_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Foreign Keys for table "care_package_item_details"
ALTER TABLE "care_package_item_details" ADD CONSTRAINT "care_package_item_details_care_package_id_fkey" FOREIGN KEY ("care_package_id") REFERENCES "care_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "care_package_item_details" ADD CONSTRAINT "care_package_item_details_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Foreign Keys for table "users"
ALTER TABLE "users" ADD CONSTRAINT "users_user_auth_id_fkey" FOREIGN KEY ("user_auth_id") REFERENCES "user_auth"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "users" ADD CONSTRAINT "users_verified_status_id_fkey" FOREIGN KEY ("verified_status_id") REFERENCES "statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

--  Foreign Keys for table "employee_to_position"
ALTER TABLE "employee_to_position" ADD CONSTRAINT "employee_to_position_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "employee_to_position" ADD CONSTRAINT "employee_to_position_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "positions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "employee_to_position" ADD CONSTRAINT "employee_to_position_employee_id_position_id_key" UNIQUE ("employee_id", "position_id");

-- Foreign Keys for table "member_care_packages"
ALTER TABLE "member_care_packages" ADD CONSTRAINT "member_care_packages_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "member_care_packages" ADD CONSTRAINT "member_care_packages_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Foreign Keys for table "member_care_package_details"
ALTER TABLE "member_care_package_details" ADD CONSTRAINT "member_care_package_details_member_care_package_id_fkey" FOREIGN KEY ("member_care_package_id") REFERENCES "member_care_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "member_care_package_details" ADD CONSTRAINT "member_care_package_details_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Foreign Keys for table "member_care_package_transaction_logs"
ALTER TABLE "member_care_package_transaction_logs" ADD CONSTRAINT "member_care_package_transaction_logs_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "member_care_package_transaction_logs" ADD CONSTRAINT "member_care_package_transaction_logs_member_care_package_d_fkey" FOREIGN KEY ("member_care_package_details_id") REFERENCES "member_care_package_details"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "member_care_package_transaction_logs" ADD CONSTRAINT "member_care_package_transaction_logs_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Foreign Keys for table "membership_accounts"
ALTER TABLE "membership_accounts" ADD CONSTRAINT "membership_accounts_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "membership_accounts" ADD CONSTRAINT "membership_accounts_membership_type_id_fkey" FOREIGN KEY ("membership_type_id") REFERENCES "membership_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Foreign Keys for table "members"
ALTER TABLE "members" ADD CONSTRAINT "members_membership_type_id_fkey" FOREIGN KEY ("membership_type_id") REFERENCES "membership_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "members" ADD CONSTRAINT "members_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Foreign Keys for table "products"
ALTER TABLE "products" ADD CONSTRAINT "products_product_category_id_fkey" FOREIGN KEY ("product_category_id") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "products" ADD CONSTRAINT "products_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "products" ADD CONSTRAINT "products_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Foreign Keys for table "services"
ALTER TABLE "services" ADD CONSTRAINT "services_service_category_id_fkey" FOREIGN KEY ("service_category_id") REFERENCES "service_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "services" ADD CONSTRAINT "services_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "services" ADD CONSTRAINT "services_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Foreign Keys for table "appointments"
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_servicing_employee_id_fkey" FOREIGN KEY ("servicing_employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Foreign Keys for table "member_voucher_details"
ALTER TABLE "member_voucher_details" ADD CONSTRAINT "member_voucher_details_member_voucher_id_fkey" FOREIGN KEY ("member_voucher_id") REFERENCES "member_vouchers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "member_voucher_details" ADD CONSTRAINT "member_voucher_details_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Foreign Keys for table "member_voucher_transaction_logs"
ALTER TABLE "member_voucher_transaction_logs" ADD CONSTRAINT "member_voucher_transaction_logs_member_voucher_id_fkey" FOREIGN KEY ("member_voucher_id") REFERENCES "member_vouchers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "member_voucher_transaction_logs" ADD CONSTRAINT "member_voucher_transaction_logs_serviced_by_fkey" FOREIGN KEY ("serviced_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "member_voucher_transaction_logs" ADD CONSTRAINT "member_voucher_transaction_logs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "member_voucher_transaction_logs" ADD CONSTRAINT "member_voucher_transaction_logs_last_updated_by_fkey" FOREIGN KEY ("last_updated_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Foreign Keys for table "member_vouchers"
ALTER TABLE "member_vouchers" ADD CONSTRAINT "member_vouchers_voucher_template_id_fkey" FOREIGN KEY ("voucher_template_id") REFERENCES "voucher_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "member_vouchers" ADD CONSTRAINT "member_vouchers_members_id_fkey" FOREIGN KEY ("members_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "member_vouchers" ADD CONSTRAINT "member_vouchers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "member_vouchers" ADD CONSTRAINT "member_vouchers_handled_by_fkey" FOREIGN KEY ("handled_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "member_vouchers" ADD CONSTRAINT "member_vouchers_last_updated_by_fkey" FOREIGN KEY ("last_updated_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Foreign Keys for table "payment_to_sale_transactions"
ALTER TABLE "payment_to_sale_transactions" ADD CONSTRAINT "payment_to_sale_transactions_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payment_to_sale_transactions" ADD CONSTRAINT "payment_to_sale_transactions_sale_transaction_id_fkey" FOREIGN KEY ("sale_transaction_id") REFERENCES "sale_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payment_to_sale_transactions" ADD CONSTRAINT "payment_to_sale_transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payment_to_sale_transactions" ADD CONSTRAINT "payment_to_sale_transactions_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Foreign Keys for table "sale_transaction_items"
ALTER TABLE "sale_transaction_items" ADD CONSTRAINT "sale_transaction_items_sale_transactions_id_fkey" FOREIGN KEY ("sale_transactions_id") REFERENCES "sale_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sale_transaction_items" ADD CONSTRAINT "sale_transaction_items_member_care_package_id_fkey" FOREIGN KEY ("member_care_package_id") REFERENCES "member_care_packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sale_transaction_items" ADD CONSTRAINT "sale_transaction_items_member_voucher_id_fkey" FOREIGN KEY ("member_voucher_id") REFERENCES "member_vouchers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Foreign Keys for table "sale_transactions"
ALTER TABLE "sale_transactions" ADD CONSTRAINT "sale_transactions_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sale_transactions" ADD CONSTRAINT "sale_transactions_reference_sales_transaction_id_fkey" FOREIGN KEY ("reference_sales_transaction_id") REFERENCES "sale_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sale_transactions" ADD CONSTRAINT "sale_transactions_handled_by_fkey" FOREIGN KEY ("handled_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sale_transactions" ADD CONSTRAINT "sale_transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Foreign Keys for table "timetables"
ALTER TABLE "timetables" ADD CONSTRAINT "timetables_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "timetables" ADD CONSTRAINT "timetables_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "timetables" ADD CONSTRAINT "timetables_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Foreign Keys for table "voucher_template_details"
ALTER TABLE "voucher_template_details" ADD CONSTRAINT "voucher_template_details_voucher_template_id_fkey" FOREIGN KEY ("voucher_template_id") REFERENCES "voucher_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "voucher_template_details" ADD CONSTRAINT "voucher_template_details_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "voucher_template_details" ADD CONSTRAINT "voucher_template_details_service_category_id_fkey" FOREIGN KEY ("service_category_id") REFERENCES "service_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Foreign Keys for table "voucher_templates"
ALTER TABLE "voucher_templates" ADD CONSTRAINT "voucher_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "voucher_templates" ADD CONSTRAINT "voucher_templates_last_updated_by_fkey" FOREIGN KEY ("last_updated_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Foreign Keys for table "employee_commissions"
ALTER TABLE "employee_commissions" ADD CONSTRAINT "employee_commissions_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Foreign Keys for table "settings"
ALTER TABLE "settings" ADD CONSTRAINT "settings_type_key" UNIQUE ("type", "key");

-- Foreign Keys for table "stored_value_accounts"
ALTER TABLE "stored_value_accounts" ADD CONSTRAINT "stored_value_accounts_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stored_value_accounts" ADD CONSTRAINT "stored_value_accounts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "stored_value_accounts" ADD CONSTRAINT "stored_value_accounts_last_updated_by_fkey" FOREIGN KEY ("last_updated_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Foreign Keys for table "stored_value_accounts_transaction_logs"
ALTER TABLE "stored_value_accounts_transaction_logs" ADD CONSTRAINT "stored_value_accounts_transaction_logs_stored_value_account_id_fkey" FOREIGN KEY ("stored_value_account_id") REFERENCES "stored_value_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stored_value_accounts_transaction_logs" ADD CONSTRAINT "stored_value_accounts_transaction_logs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "stored_value_accounts_transaction_logs" ADD CONSTRAINT "stored_value_accounts_transaction_logs_last_updated_by_fkey" FOREIGN KEY ("last_updated_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Performance Indexes

-- Unique indexes for lookup columns that should be unique
CREATE UNIQUE INDEX "statuses_status_name_key" ON "statuses"("status_name");
CREATE UNIQUE INDEX "employees_employee_email_key" ON "employees"("employee_email");
CREATE UNIQUE INDEX "employees_employee_code_key" ON "employees"("employee_code");
CREATE UNIQUE INDEX "members_email_key" ON "members"("email");
CREATE UNIQUE INDEX "members_nric_key" ON "members"("nric");
CREATE UNIQUE INDEX "roles_role_name_key" ON "roles"("role_name");
CREATE UNIQUE INDEX "positions_position_name_key" ON "positions"("position_name");
CREATE UNIQUE INDEX "product_categories_product_category_name_key" ON "product_categories"("product_category_name");
CREATE UNIQUE INDEX "membership_types_membership_type_name_key" ON "membership_types"("membership_type_name");
CREATE UNIQUE INDEX "services_service_name_key" ON "services"("service_name");
CREATE UNIQUE INDEX "service_categories_service_category_name_key" ON "service_categories"("service_category_name");
CREATE UNIQUE INDEX "voucher_templates_voucher_template_name_key" ON "voucher_templates"("voucher_template_name");
CREATE UNIQUE INDEX "voucher_template_details_service_id_voucher_template_id_key" ON "voucher_template_details"("service_id", "voucher_template_id");
CREATE UNIQUE INDEX "user_auth_email_key" ON "user_auth"("email");

-- Indexes on Foreign Keys and other searchable columns
CREATE INDEX "fki_cs_service_service_category_id_fkey" ON "services"("service_category_id");
CREATE INDEX "idx_care_packages_created_by" ON "care_packages"("created_by");
CREATE INDEX "idx_care_package_item_details_care_package_id" ON "care_package_item_details"("care_package_id");
CREATE INDEX "idx_care_package_item_details_service_id" ON "care_package_item_details"("service_id");
CREATE INDEX "idx_member_care_packages_member_id" ON "member_care_packages"("member_id");
CREATE INDEX "idx_member_care_packages_employee_id" ON "member_care_packages"("employee_id");
CREATE INDEX "idx_member_care_package_details_mcp_id" ON "member_care_package_details"("member_care_package_id");
CREATE INDEX "idx_mcp_transaction_logs_details_id" ON "member_care_package_transaction_logs"("member_care_package_details_id");
CREATE INDEX "idx_members_membership_type_id" ON "members"("membership_type_id");
CREATE INDEX "idx_membership_accounts_member_id" ON "membership_accounts"("member_id");
CREATE INDEX "idx_membership_accounts_membership_type_id" ON "membership_accounts"("membership_type_id");
CREATE INDEX "idx_membership_accounts_status_id" ON "membership_accounts"("status_id");
CREATE INDEX "idx_products_product_category_id" ON "products"("product_category_id");
CREATE INDEX "idx_products_product_name" ON "products"("product_name");
CREATE INDEX "idx_services_service_name" ON "services"("service_name");
CREATE INDEX "idx_user_to_role_user_auth_id" ON "user_to_role"("user_auth_id");
CREATE INDEX "idx_user_to_role_role_id" ON "user_to_role"("role_id");
CREATE INDEX "idx_appointments_member_id" ON "appointments"("member_id");
CREATE INDEX "idx_appointments_servicing_employee_id" ON "appointments"("servicing_employee_id");
CREATE INDEX "idx_appointments_appointment_date" ON "appointments"("appointment_date");
CREATE INDEX "idx_member_voucher_details_mv_id" ON "member_voucher_details"("member_voucher_id");
CREATE INDEX "idx_member_vouchers_members_id" ON "member_vouchers"("members_id");
CREATE INDEX "idx_member_vouchers_voucher_template_id" ON "member_vouchers"("voucher_template_id");
CREATE INDEX "idx_payment_to_sale_trans_sale_id" ON "payment_to_sale_transactions"("sale_transaction_id");
CREATE INDEX "idx_sale_transaction_items_sale_id" ON "sale_transaction_items"("sale_transactions_id");
CREATE INDEX "idx_sale_transactions_member_id" ON "sale_transactions"("member_id");
CREATE INDEX "idx_sale_transactions_handled_by" ON "sale_transactions"("handled_by");
CREATE INDEX "idx_sale_transactions_created_at" ON "sale_transactions"("created_at");
CREATE INDEX "idx_timetables_employee_id" ON "timetables"("employee_id");
CREATE INDEX "idx_voucher_template_details_template_id" ON "voucher_template_details"("voucher_template_id");
CREATE INDEX "idx_voucher_template_details_service_id" ON "voucher_template_details"("service_id");
CREATE INDEX "idx_voucher_template_details_service_category_id" ON "voucher_template_details"("service_category_id");
CREATE INDEX "idx_employee_commissions_employee_id" ON "employee_commissions"("employee_id");
CREATE INDEX "idx_stored_value_accounts_member_id" ON "stored_value_accounts"("member_id");
CREATE INDEX "idx_stored_value_accounts_created_by" ON "stored_value_accounts"("created_by");
CREATE INDEX "idx_stored_value_accounts_last_updated_by" ON "stored_value_accounts"("last_updated_by");
CREATE INDEX "idx_stored_value_accounts_transaction_logs_account_id" ON "stored_value_accounts_transaction_logs"("stored_value_account_id");
CREATE INDEX "idx_stored_value_accounts_transaction_logs_created_by" ON "stored_value_accounts_transaction_logs"("created_by");
CREATE INDEX "idx_stored_value_accounts_transaction_logs_updated_by" ON "stored_value_accounts_transaction_logs"("last_updated_by");