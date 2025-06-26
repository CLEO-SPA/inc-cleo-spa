-- Drop Tables
DROP TABLE IF EXISTS "care_packages" CASCADE;
DROP TABLE IF EXISTS "care_package_item_details" CASCADE;
DROP TABLE IF EXISTS "employees" CASCADE;
DROP TABLE IF EXISTS "serving_employee_to_invoice_items" CASCADE;
DROP TABLE IF EXISTS "refunds" CASCADE;
DROP TABLE IF EXISTS "refund_items" CASCADE;
DROP TABLE IF EXISTS "invoice_items" CASCADE;
DROP TABLE IF EXISTS "invoice_payments" CASCADE;
DROP TABLE IF EXISTS "invoices" CASCADE;
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
    "user_auth_id" BIGINT NOT NULL,
    "employee_code" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "employee_contact" VARCHAR(20) NOT NULL,
    "employee_email" VARCHAR(255) NOT NULL,
    "employee_is_active" BOOLEAN NOT NULL,
    "verified_status_id" BIGINT NOT NULL,
    "employee_name" VARCHAR(100) NOT NULL,
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
CREATE TABLE "serving_employee_to_invoice_items" (
    "id" BIGSERIAL NOT NULL,
    "commission_percentage" DECIMAL(10,2),
    "custom_commission_percentage" DECIMAL(10,2),
    "final_calculated_commission_value" DECIMAL(10,2),
    "reward_status" VARCHAR(10),
    "rewarded_for_period_month" SMALLINT,
    "rewarded_for_period_year" SMALLINT,
    "system_generated_remarks" TEXT,
    "user_remarks" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "invoice_item_id" BIGINT NOT NULL,
    "reviewed_by_employee_id" BIGINT,
    "sharing_ratio" DECIMAL,
    "employee_id" BIGINT,
    "final_revenue_performance" DECIMAL,

    CONSTRAINT "serving_employee_to_invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refunds" (
    "id" BIGSERIAL NOT NULL,
    "invoice_id" BIGINT,
    "refund_total_amount" DECIMAL(10,2),
    "refund_remarks" TEXT,
    "refund_date" TIMESTAMPTZ(6),
    "employee_id" BIGINT,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refund_items" (
    "id" BIGSERIAL NOT NULL,
    "refund_id" BIGINT,
    "invoice_item_id" BIGINT,
    "refund_quantity" INTEGER,
    "refund_item_amount" DECIMAL(10,2),
    "refund_item_remarks" TEXT,

    CONSTRAINT "refund_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" BIGSERIAL NOT NULL,
    "invoice_id" BIGINT NOT NULL,
    "service_name" VARCHAR(255),
    "product_name" VARCHAR(255),
    "member_care_package_id" BIGINT,
    "original_unit_price" DECIMAL(10,2),
    "custom_unit_price" DECIMAL(10,2),
    "discount_percentage" DECIMAL(10,2),
    "quantity" INTEGER NOT NULL,
    "remarks" TEXT,
    "amount" DECIMAL(10,2),
    "item_type" "item_type" NOT NULL,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_payments" (
    "id" BIGSERIAL NOT NULL,
    "payment_method_id" BIGINT NOT NULL,
    "invoice_id" BIGINT NOT NULL,
    "invoice_payment_amount" DECIMAL(10,2),
    "remarks" TEXT,
    "invoice_payment_created_by" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "invoice_payment_updated_by" BIGINT NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "invoice_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" BIGSERIAL NOT NULL,
    "customer_type" "customer_type" NOT NULL,
    "member_id" BIGINT NOT NULL,
    "total_paid_amount" DECIMAL(10,2) NOT NULL,
    "outstanding_total_payment_amount" DECIMAL(10,2) NOT NULL,
    "invoice_status" BIGINT NOT NULL,
    "remarks" TEXT,
    "manual_invoice_no" VARCHAR(50),
    "reference_invoice_id" BIGINT,
    "invoice_handler_employee_id" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "total_invoice_amount" DECIMAL(10,2),

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
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
    "service_id" BIGINT NOT NULL,
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
    "service_id" BIGINT NOT NULL,

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
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    "created_by" INTEGER,
    "user_auth_id" BIGINT,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership_accounts" (
    "membership_accounts_id" BIGSERIAL NOT NULL,
    "member_id" BIGINT NOT NULL,
    "membership_type_id" BIGINT NOT NULL,
    "start_date" TIMESTAMP(6) NOT NULL,
    "end_date" TIMESTAMP(6),
    "is_active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "status_id" BIGINT NOT NULL,

    CONSTRAINT "cs_membership_accounts_pkey" PRIMARY KEY ("membership_accounts_id")
);

-- CreateTable
CREATE TABLE "membership_types" (
    "id" BIGSERIAL NOT NULL,
    "membership_type_name" VARCHAR(50) NOT NULL,
    "default_discount_for_products" DECIMAL,
    "default_discount_percentage_for_service" DECIMAL,
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "membership_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_methods" (
    "id" BIGINT NOT NULL,
    "payment_method_name" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL,
    "is_revenue" BOOLEAN NOT NULL,
    "show_on_payment_page" BOOLEAN NOT NULL DEFAULT true,
    "is_protected" BOOLEAN NOT NULL DEFAULT false,
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
    "product_default_price" DECIMAL(10,2),
    "product_outlet_id" BIGINT NOT NULL,
    "product_is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "product_category_id" BIGINT,

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
    "service_created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "service_updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
    "id" BIGINT NOT NULL,
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
    "id" BIGINT NOT NULL,
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
    "members_id" INTEGER NOT NULL,
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
    "sale_transactions_id" INTEGER,
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
CREATE TABLE "user_auth" (
    "id" BIGSERIAL NOT NULL,
    "password" VARCHAR(72),
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "email" VARCHAR(50),
    "phone" VARCHAR(20),

    CONSTRAINT "user_auth_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "statuses_status_name_key" ON "statuses"("status_name");

-- CreateIndex
CREATE INDEX "fki_cs_service_service_category_id_fkey" ON "services"("service_category_id");

-- Foreign Keys for table "care_packages"
ALTER TABLE "care_packages" ADD CONSTRAINT "care_packages_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "care_packages" ADD CONSTRAINT "care_packages_last_updated_by_fkey" FOREIGN KEY ("last_updated_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;

-- Foreign Keys for table "care_package_item_details"
ALTER TABLE "care_package_item_details" ADD CONSTRAINT "care_package_item_details_care_package_id_fkey" FOREIGN KEY ("care_package_id") REFERENCES "care_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "care_package_item_details" ADD CONSTRAINT "care_package_item_details_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;

-- Foreign Keys for table "employees"
ALTER TABLE "employees" ADD CONSTRAINT "employees_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "positions"("id") ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "employees" ADD CONSTRAINT "employees_user_auth_id_fkey" FOREIGN KEY ("user_auth_id") REFERENCES "user_auth"("id") ON DELETE RESTRICT ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "employees" ADD CONSTRAINT "verified_status_id_fkey" FOREIGN KEY ("verified_status_id") REFERENCES "statuses"("id") ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;

--  Foreign Keys for table "employee_to_position"
ALTER TABLE "employee_to_position" ADD CONSTRAINT "employee_to_position_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "employee_to_position" ADD CONSTRAINT "employee_to_position_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "positions"("id") ON DELETE RESTRICT ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "employee_to_position" ADD CONSTRAINT "employee_to_position_employee_id_position_id_key" UNIQUE ("employee_id", "position_id");

-- Foreign Keys for table "serving_employee_to_invoice_items"
ALTER TABLE "serving_employee_to_invoice_items" ADD CONSTRAINT "serving_employee_to_invoice_ite_reviewed_by_employee_id_fkey" FOREIGN KEY ("reviewed_by_employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "serving_employee_to_invoice_items" ADD CONSTRAINT "serving_employee_to_invoice_items_invoice_item_id_fkey" FOREIGN KEY ("invoice_item_id") REFERENCES "invoice_items"("id") ON DELETE CASCADE ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;

-- Foreign Keys for table "refunds"
ALTER TABLE "refunds" ADD CONSTRAINT "fk_employee" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "refunds" ADD CONSTRAINT "fk_refunds_invoice_id" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY DEFERRED;

-- Foreign Keys for table "refund_items"
ALTER TABLE "refund_items" ADD CONSTRAINT "fk_refund_items_invoice_item_id" FOREIGN KEY ("invoice_item_id") REFERENCES "invoice_items"("id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "refund_items" ADD CONSTRAINT "fk_refund_items_refund_id" FOREIGN KEY ("refund_id") REFERENCES "refunds"("id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY DEFERRED;

-- Foreign Keys for table "invoice_items"
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE NO ACTION DEFERRABLE INITIALLY DEFERRED;

-- Foreign Keys for table "invoice_payments"
ALTER TABLE "invoice_payments" ADD CONSTRAINT "invoice_payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE NO ACTION DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "invoice_payments" ADD CONSTRAINT "invoice_payments_invoice_payment_created_by_fkey" FOREIGN KEY ("invoice_payment_created_by") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "invoice_payments" ADD CONSTRAINT "invoice_payments_invoice_payment_updated_by_fkey" FOREIGN KEY ("invoice_payment_updated_by") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "invoice_payments" ADD CONSTRAINT "invoice_payments_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;

-- Foreign Keys for table "invoices"
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_invoice_handler_employee_id_fkey" FOREIGN KEY ("invoice_handler_employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_invoice_status_fkey" FOREIGN KEY ("invoice_status") REFERENCES "statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;

-- Foreign Keys for table "member_care_packages"
ALTER TABLE "member_care_packages" ADD CONSTRAINT "member_care_packages_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "member_care_packages" ADD CONSTRAINT "member_care_packages_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;

-- Foreign Keys for table "member_care_package_details"
ALTER TABLE "member_care_package_details" ADD CONSTRAINT "member_care_package_details_member_care_package_id_fkey" FOREIGN KEY ("member_care_package_id") REFERENCES "member_care_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "member_care_package_details" ADD CONSTRAINT "member_care_package_details_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;

-- Foreign Keys for table "member_care_package_transaction_logs"
ALTER TABLE "member_care_package_transaction_logs" ADD CONSTRAINT "member_care_package_transaction_logs_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "member_care_package_transaction_logs" ADD CONSTRAINT "member_care_package_transaction_logs_member_care_package_d_fkey" FOREIGN KEY ("member_care_package_details_id") REFERENCES "member_care_package_details"("id") ON DELETE CASCADE ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "member_care_package_transaction_logs" ADD CONSTRAINT "member_care_package_transaction_logs_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;

-- Foreign Keys for table "members"
ALTER TABLE "members" ADD CONSTRAINT "members_user_auth_id_fkey" FOREIGN KEY ("user_auth_id") REFERENCES "user_auth"("id") ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;

-- Foreign Keys for table "membership_accounts"
ALTER TABLE "membership_accounts" ADD CONSTRAINT "membership_accounts_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;

-- Foreign Keys for table "user_to_role"
ALTER TABLE "user_to_role" ADD CONSTRAINT "user_to_role_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "user_to_role" ADD CONSTRAINT "user_to_role_user_id_fkey" FOREIGN KEY ("user_auth_id") REFERENCES "user_auth"("id") ON DELETE RESTRICT ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;