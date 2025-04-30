/*
  Warnings:

  - You are about to drop the `cs_application_type` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cs_audit_creation_log` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cs_audit_deletion_log` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cs_audit_modification_log` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cs_care_package` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cs_care_package_item_details` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cs_care_package_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cs_department` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cs_employee_performance_incentive_rules` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cs_employees` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cs_invoice_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cs_invoice_payment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cs_invoices` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cs_member_care_package` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cs_member_care_package_details` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cs_member_care_package_items_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cs_member_care_package_transaction_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cs_members` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cs_membership_accounts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cs_membership_history` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cs_membership_type` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cs_payment_method` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cs_permissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cs_position` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cs_product_categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cs_products` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cs_refund_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cs_refunds` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cs_role_permissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cs_roles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cs_service` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cs_service_categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cs_serving_employee_to_invoice_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cs_status` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cs_stored_value_accounts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cs_stored_value_transactions_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cs_task_queue` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cs_translation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cs_user_auth` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cs_user_roles` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "customer_type" AS ENUM ('Member', 'Walk_In_Customer');

-- CreateEnum
CREATE TYPE "item_type" AS ENUM ('Product', 'Service', 'Member_Care_Package', 'Membership_Account');

-- DropForeignKey
ALTER TABLE "cs_audit_creation_log" DROP CONSTRAINT "cs_audit_creation_log_user_id_fkey";

-- DropForeignKey
ALTER TABLE "cs_audit_deletion_log" DROP CONSTRAINT "cs_audit_deletion_log_user_id_fkey";

-- DropForeignKey
ALTER TABLE "cs_audit_modification_log" DROP CONSTRAINT "cs_audit_modification_log_user_id_fkey";

-- DropForeignKey
ALTER TABLE "cs_care_package" DROP CONSTRAINT "cs_care_package_care_package_status_fkey";

-- DropForeignKey
ALTER TABLE "cs_care_package_item_details" DROP CONSTRAINT "cs_care_package_item_details_care_package_id_fkey";

-- DropForeignKey
ALTER TABLE "cs_care_package_item_details" DROP CONSTRAINT "fk_service";

-- DropForeignKey
ALTER TABLE "cs_care_package_items" DROP CONSTRAINT "cs_care_package_items_care_package_id_fkey";

-- DropForeignKey
ALTER TABLE "cs_employee_performance_incentive_rules" DROP CONSTRAINT "cs_employee_performance_incentive_rule_application_type_id_fkey";

-- DropForeignKey
ALTER TABLE "cs_employees" DROP CONSTRAINT "cs_employees_department_id_fkey";

-- DropForeignKey
ALTER TABLE "cs_employees" DROP CONSTRAINT "fk_position_id";

-- DropForeignKey
ALTER TABLE "cs_invoice_items" DROP CONSTRAINT "cs_invoice_items_invoice_id_fkey";

-- DropForeignKey
ALTER TABLE "cs_invoice_payment" DROP CONSTRAINT "cs_invoice_payment_invoice_id_fkey";

-- DropForeignKey
ALTER TABLE "cs_invoice_payment" DROP CONSTRAINT "cs_invoice_payment_invoice_payment_created_by_fkey";

-- DropForeignKey
ALTER TABLE "cs_invoice_payment" DROP CONSTRAINT "cs_invoice_payment_invoice_payment_updated_by_fkey";

-- DropForeignKey
ALTER TABLE "cs_invoice_payment" DROP CONSTRAINT "cs_invoice_payment_payment_method_id_fkey";

-- DropForeignKey
ALTER TABLE "cs_invoices" DROP CONSTRAINT "cs_invoices_invoice_handler_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "cs_invoices" DROP CONSTRAINT "cs_invoices_invoice_status_fkey";

-- DropForeignKey
ALTER TABLE "cs_invoices" DROP CONSTRAINT "cs_invoices_member_id_fkey";

-- DropForeignKey
ALTER TABLE "cs_member_care_package" DROP CONSTRAINT "cs_member_care_package_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "cs_member_care_package" DROP CONSTRAINT "cs_member_care_package_member_care_package_status_fkey";

-- DropForeignKey
ALTER TABLE "cs_member_care_package" DROP CONSTRAINT "cs_member_care_package_member_id_fkey";

-- DropForeignKey
ALTER TABLE "cs_member_care_package_details" DROP CONSTRAINT "cs_member_care_package_details_member_care_package_id_fkey";

-- DropForeignKey
ALTER TABLE "cs_member_care_package_details" DROP CONSTRAINT "cs_member_care_package_details_service_id_fkey";

-- DropForeignKey
ALTER TABLE "cs_member_care_package_details" DROP CONSTRAINT "cs_member_care_package_details_status_id_fkey";

-- DropForeignKey
ALTER TABLE "cs_member_care_package_items_logs" DROP CONSTRAINT "cs_member_care_package_items_logs_member_care_package_deta_fkey";

-- DropForeignKey
ALTER TABLE "cs_member_care_package_transaction_logs" DROP CONSTRAINT "cs_member_care_package_transaction_logs_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "cs_member_care_package_transaction_logs" DROP CONSTRAINT "cs_member_care_package_transaction_logs_member_care_packag_fkey";

-- DropForeignKey
ALTER TABLE "cs_membership_accounts" DROP CONSTRAINT "fk_member_id";

-- DropForeignKey
ALTER TABLE "cs_membership_accounts" DROP CONSTRAINT "fk_membership_type_id";

-- DropForeignKey
ALTER TABLE "cs_membership_accounts" DROP CONSTRAINT "fk_status_id";

-- DropForeignKey
ALTER TABLE "cs_membership_history" DROP CONSTRAINT "cs_membership_history_member_id_fkey";

-- DropForeignKey
ALTER TABLE "cs_membership_history" DROP CONSTRAINT "cs_membership_history_new_membership_type_id_fkey";

-- DropForeignKey
ALTER TABLE "cs_membership_history" DROP CONSTRAINT "cs_membership_history_old_membership_type_id_fkey";

-- DropForeignKey
ALTER TABLE "cs_membership_type" DROP CONSTRAINT "cs_membership_type_account_creation_performance_rule_id_fkey";

-- DropForeignKey
ALTER TABLE "cs_position" DROP CONSTRAINT "cs_position_department_id_fkey";

-- DropForeignKey
ALTER TABLE "cs_products" DROP CONSTRAINT "cs_products_product_category_id_fkey";

-- DropForeignKey
ALTER TABLE "cs_refund_items" DROP CONSTRAINT "fk_cs_refund_items_invoice_item_id";

-- DropForeignKey
ALTER TABLE "cs_refund_items" DROP CONSTRAINT "fk_cs_refund_items_refund_id";

-- DropForeignKey
ALTER TABLE "cs_refunds" DROP CONSTRAINT "fk_cs_refunds_invoice_id";

-- DropForeignKey
ALTER TABLE "cs_refunds" DROP CONSTRAINT "fk_employee";

-- DropForeignKey
ALTER TABLE "cs_role_permissions" DROP CONSTRAINT "cs_role_permissions_permission_id_fkey";

-- DropForeignKey
ALTER TABLE "cs_role_permissions" DROP CONSTRAINT "cs_role_permissions_role_id_fkey";

-- DropForeignKey
ALTER TABLE "cs_service" DROP CONSTRAINT "cs_service_categories_service_category_id_fkey";

-- DropForeignKey
ALTER TABLE "cs_serving_employee_to_invoice_items" DROP CONSTRAINT "cs_serving_employee_to_invoice_ite_reviewed_by_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "cs_serving_employee_to_invoice_items" DROP CONSTRAINT "cs_serving_employee_to_invoice_items_invoice_item_id_fkey";

-- DropForeignKey
ALTER TABLE "cs_stored_value_accounts" DROP CONSTRAINT "fk_cs_stored_value_accounts_member_id";

-- DropForeignKey
ALTER TABLE "cs_stored_value_transactions_logs" DROP CONSTRAINT "cs_stored_value_transactions_logs_stored_value_account_id_fkey";

-- DropForeignKey
ALTER TABLE "cs_task_queue" DROP CONSTRAINT "cs_task_queue_cs_serviceService_id_fkey";

-- DropForeignKey
ALTER TABLE "cs_task_queue" DROP CONSTRAINT "cs_task_queue_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "cs_task_queue" DROP CONSTRAINT "cs_task_queue_status_id_fkey";

-- DropForeignKey
ALTER TABLE "cs_user_auth" DROP CONSTRAINT "cs_user_auth_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "cs_user_roles" DROP CONSTRAINT "cs_user_roles_role_permission_id_fkey";

-- DropForeignKey
ALTER TABLE "cs_user_roles" DROP CONSTRAINT "cs_user_roles_user_id_fkey";

-- DropTable
DROP TABLE "cs_application_type";

-- DropTable
DROP TABLE "cs_audit_creation_log";

-- DropTable
DROP TABLE "cs_audit_deletion_log";

-- DropTable
DROP TABLE "cs_audit_modification_log";

-- DropTable
DROP TABLE "cs_care_package";

-- DropTable
DROP TABLE "cs_care_package_item_details";

-- DropTable
DROP TABLE "cs_care_package_items";

-- DropTable
DROP TABLE "cs_department";

-- DropTable
DROP TABLE "cs_employee_performance_incentive_rules";

-- DropTable
DROP TABLE "cs_employees";

-- DropTable
DROP TABLE "cs_invoice_items";

-- DropTable
DROP TABLE "cs_invoice_payment";

-- DropTable
DROP TABLE "cs_invoices";

-- DropTable
DROP TABLE "cs_member_care_package";

-- DropTable
DROP TABLE "cs_member_care_package_details";

-- DropTable
DROP TABLE "cs_member_care_package_items_logs";

-- DropTable
DROP TABLE "cs_member_care_package_transaction_logs";

-- DropTable
DROP TABLE "cs_members";

-- DropTable
DROP TABLE "cs_membership_accounts";

-- DropTable
DROP TABLE "cs_membership_history";

-- DropTable
DROP TABLE "cs_membership_type";

-- DropTable
DROP TABLE "cs_payment_method";

-- DropTable
DROP TABLE "cs_permissions";

-- DropTable
DROP TABLE "cs_position";

-- DropTable
DROP TABLE "cs_product_categories";

-- DropTable
DROP TABLE "cs_products";

-- DropTable
DROP TABLE "cs_refund_items";

-- DropTable
DROP TABLE "cs_refunds";

-- DropTable
DROP TABLE "cs_role_permissions";

-- DropTable
DROP TABLE "cs_roles";

-- DropTable
DROP TABLE "cs_service";

-- DropTable
DROP TABLE "cs_service_categories";

-- DropTable
DROP TABLE "cs_serving_employee_to_invoice_items";

-- DropTable
DROP TABLE "cs_status";

-- DropTable
DROP TABLE "cs_stored_value_accounts";

-- DropTable
DROP TABLE "cs_stored_value_transactions_logs";

-- DropTable
DROP TABLE "cs_task_queue";

-- DropTable
DROP TABLE "cs_translation";

-- DropTable
DROP TABLE "cs_user_auth";

-- DropTable
DROP TABLE "cs_user_roles";

-- DropEnum
DROP TYPE "cs_customer_type";

-- DropEnum
DROP TYPE "cs_item_type";

-- CreateTable
CREATE TABLE "application_type" (
    "application_type_id" BIGSERIAL NOT NULL,
    "application_type" VARCHAR(50) NOT NULL,
    "remarks" TEXT,

    CONSTRAINT "application_type_pkey" PRIMARY KEY ("application_type_id")
);

-- CreateTable
CREATE TABLE "audit_creation_log" (
    "log_id" BIGSERIAL NOT NULL,
    "user_id" BIGINT,
    "table_name" VARCHAR(50),
    "record_id" BIGINT,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data" JSONB,

    CONSTRAINT "audit_creation_log_pkey" PRIMARY KEY ("log_id")
);

-- CreateTable
CREATE TABLE "audit_deletion_log" (
    "log_id" BIGSERIAL NOT NULL,
    "user_id" BIGINT,
    "table_name" VARCHAR(50),
    "record_id" BIGINT,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_data" JSONB,

    CONSTRAINT "audit_deletion_log_pkey" PRIMARY KEY ("log_id")
);

-- CreateTable
CREATE TABLE "audit_modification_log" (
    "log_id" BIGSERIAL NOT NULL,
    "user_id" BIGINT,
    "table_name" VARCHAR(50),
    "record_id" BIGINT,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "old_data" JSONB,
    "new_data" JSONB,
    "changed_fields" JSONB,

    CONSTRAINT "audit_modification_log_pkey" PRIMARY KEY ("log_id")
);

-- CreateTable
CREATE TABLE "care_package" (
    "care_package_id" BIGSERIAL NOT NULL,
    "care_package_name" VARCHAR(200) NOT NULL,
    "care_package_remarks" TEXT,
    "care_package_price" DECIMAL(10,2) NOT NULL,
    "care_package_status" BIGINT NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "care_package_customizable" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "care_package_pkey" PRIMARY KEY ("care_package_id")
);

-- CreateTable
CREATE TABLE "care_package_item_details" (
    "care_package_item_details_id" BIGSERIAL NOT NULL,
    "care_package_item_details_quantity" INTEGER NOT NULL,
    "care_package_item_details_discount" DECIMAL(10,2) NOT NULL,
    "care_package_item_details_price" DECIMAL(10,2) NOT NULL,
    "service_id" BIGINT NOT NULL,
    "care_package_id" BIGINT NOT NULL,

    CONSTRAINT "care_package_item_details_pkey" PRIMARY KEY ("care_package_item_details_id")
);

-- CreateTable
CREATE TABLE "care_package_items" (
    "care_package_items_id" BIGSERIAL NOT NULL,
    "care_package_id" BIGINT NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "care_package_items_pkey" PRIMARY KEY ("care_package_items_id")
);

-- CreateTable
CREATE TABLE "department" (
    "department_id" BIGSERIAL NOT NULL,
    "department_name" VARCHAR(200) NOT NULL,
    "department_description" VARCHAR(255),
    "department_is_active" BOOLEAN NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at_utc" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "department_pkey" PRIMARY KEY ("department_id")
);

-- CreateTable
CREATE TABLE "employee_performance_incentive_rules" (
    "employee_performance_incentive_rules_id" BIGSERIAL NOT NULL,
    "application_type_id" BIGINT,
    "percentage_value" DECIMAL,
    "absolute_value" DECIMAL,
    "remarks" TEXT,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_performance_incentive_rules_pkey" PRIMARY KEY ("employee_performance_incentive_rules_id")
);

-- CreateTable
CREATE TABLE "employees" (
    "employee_id" BIGSERIAL NOT NULL,
    "employee_code" VARCHAR(50) NOT NULL,
    "department_id" BIGINT NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "employee_contact" VARCHAR(20) NOT NULL,
    "employee_email" VARCHAR(255) NOT NULL,
    "employee_is_active" BOOLEAN NOT NULL,
    "employee_name" VARCHAR(100) NOT NULL,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "position_id" BIGINT,
    "commission_percentage" DECIMAL(10,2) DEFAULT 0.00,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("employee_id")
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "invoice_item_id" BIGSERIAL NOT NULL,
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

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("invoice_item_id")
);

-- CreateTable
CREATE TABLE "invoice_payment" (
    "invoice_payment_id" BIGSERIAL NOT NULL,
    "payment_method_id" BIGINT NOT NULL,
    "invoice_id" BIGINT NOT NULL,
    "invoice_payment_amount" DECIMAL(10,2),
    "remarks" TEXT,
    "invoice_payment_created_by" BIGINT NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invoice_payment_updated_by" BIGINT NOT NULL,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_payment_pkey" PRIMARY KEY ("invoice_payment_id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "invoice_id" BIGSERIAL NOT NULL,
    "customer_type" "customer_type" NOT NULL,
    "member_id" BIGINT NOT NULL,
    "total_paid_amount" DECIMAL(10,2) NOT NULL,
    "outstanding_total_payment_amount" DECIMAL(10,2) NOT NULL,
    "invoice_status" BIGINT NOT NULL,
    "remarks" TEXT,
    "manual_invoice_no" VARCHAR(50),
    "reference_invoice_id" BIGINT,
    "invoice_handler_employee_id" BIGINT NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total_invoice_amount" DECIMAL(10,2),

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("invoice_id")
);

-- CreateTable
CREATE TABLE "member_care_package" (
    "member_care_package_id" BIGSERIAL NOT NULL,
    "member_id" BIGINT NOT NULL,
    "employee_id" BIGINT NOT NULL,
    "care_package_name" VARCHAR(100) NOT NULL,
    "member_care_package_status" BIGINT NOT NULL,
    "member_care_package_total_amount" DECIMAL(10,2) NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "care_package_remarks" VARCHAR(255),

    CONSTRAINT "member_care_package_pkey" PRIMARY KEY ("member_care_package_id")
);

-- CreateTable
CREATE TABLE "member_care_package_details" (
    "member_care_package_details_id" BIGSERIAL NOT NULL,
    "member_care_package_details_discount" DECIMAL(10,2) NOT NULL,
    "member_care_package_details_price" DECIMAL(10,2) NOT NULL,
    "member_care_package_id" BIGINT NOT NULL,
    "service_id" BIGINT,
    "status_id" BIGINT NOT NULL,

    CONSTRAINT "member_care_package_details_pkey" PRIMARY KEY ("member_care_package_details_id")
);

-- CreateTable
CREATE TABLE "member_care_package_items_logs" (
    "member_care_package_items_logs_id" BIGSERIAL NOT NULL,
    "member_care_package_items_logs_type" VARCHAR(100) NOT NULL,
    "member_care_package_item_logs_description" TEXT NOT NULL,
    "member_care_package_item_status" BIGINT NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "member_care_package_details_id" BIGINT NOT NULL,

    CONSTRAINT "member_care_package_items_logs_pkey" PRIMARY KEY ("member_care_package_items_logs_id")
);

-- CreateTable
CREATE TABLE "member_care_package_transaction_logs" (
    "member_care_package_transaction_log_id" BIGSERIAL NOT NULL,
    "member_care_package_transaction_logs_transaction_type" VARCHAR(100) NOT NULL,
    "member_care_package_transaction_logs_description" TEXT NOT NULL,
    "member_care_package_transaction_logs_amount" DECIMAL(10,2) NOT NULL,
    "member_care_package_transaction_logs_transaction_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "member_care_package_details_id" BIGINT NOT NULL,
    "employee_id" BIGINT NOT NULL,
    "member_care_package_transaction_logs_quantity" INTEGER,
    "service_id" INTEGER,

    CONSTRAINT "member_care_package_transaction_logs_pkey" PRIMARY KEY ("member_care_package_transaction_log_id")
);

-- CreateTable
CREATE TABLE "members" (
    "member_id" BIGSERIAL NOT NULL,
    "member_name" VARCHAR(200) NOT NULL,
    "member_email" VARCHAR(150) NOT NULL,
    "member_contact" CHAR(8),
    "member_sex" CHAR(1),
    "member_dob" DATE NOT NULL,
    "remarks" TEXT,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "members_pkey" PRIMARY KEY ("member_id")
);

-- CreateTable
CREATE TABLE "membership_accounts" (
    "membership_accounts_id" BIGSERIAL NOT NULL,
    "member_id" BIGINT NOT NULL,
    "membership_type_id" BIGINT NOT NULL,
    "start_date" TIMESTAMP(6) NOT NULL,
    "end_date" TIMESTAMP(6),
    "is_active" BOOLEAN NOT NULL,
    "created_at_utc" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at_utc" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status_id" BIGINT NOT NULL,

    CONSTRAINT "membership_accounts_pkey" PRIMARY KEY ("membership_accounts_id")
);

-- CreateTable
CREATE TABLE "membership_history" (
    "membership_history_id" BIGSERIAL NOT NULL,
    "member_id" BIGINT NOT NULL,
    "old_membership_type_id" BIGINT,
    "new_membership_type_id" BIGINT,
    "remarks" TEXT,
    "created_at_utc" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "membership_history_pkey" PRIMARY KEY ("membership_history_id")
);

-- CreateTable
CREATE TABLE "membership_type" (
    "membership_type_id" BIGSERIAL NOT NULL,
    "membership_type_name" VARCHAR(50) NOT NULL,
    "default_discount_for_products" DECIMAL,
    "default_discount_percentage_for_service" DECIMAL,
    "account_stored_value_top_up_performance_rule_id" BIGINT,
    "account_stored_value_top_up_commission_rule_id" BIGINT,
    "account_creation_performance_rule_id" BIGINT,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "default_stored_value" DECIMAL,
    "account_creation_commission_rule_id" BIGINT,

    CONSTRAINT "membership_type_pkey" PRIMARY KEY ("membership_type_id")
);

-- CreateTable
CREATE TABLE "payment_method" (
    "payment_method_id" BIGSERIAL NOT NULL,
    "payment_method_name" VARCHAR(50) NOT NULL,
    "is_active" BOOLEAN,
    "is_used_to_create_pending_invoice" BOOLEAN,
    "is_used_to_deduct_from_package" BOOLEAN,
    "is_revenue" BOOLEAN,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_method_pkey" PRIMARY KEY ("payment_method_id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "permission_id" BIGSERIAL NOT NULL,
    "read_access" BOOLEAN NOT NULL,
    "update_access" BOOLEAN NOT NULL,
    "create_access" BOOLEAN NOT NULL,
    "delete_access" BOOLEAN NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("permission_id")
);

-- CreateTable
CREATE TABLE "position" (
    "position_id" BIGSERIAL NOT NULL,
    "position_name" VARCHAR(255) NOT NULL,
    "position_description" VARCHAR(255),
    "position_is_active" BOOLEAN DEFAULT true,
    "default_commission_percentage" DECIMAL(10,2),
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "department_id" BIGINT NOT NULL,

    CONSTRAINT "position_pkey" PRIMARY KEY ("position_id")
);

-- CreateTable
CREATE TABLE "product_categories" (
    "product_category_id" BIGSERIAL NOT NULL,
    "product_category_name" VARCHAR(255) NOT NULL,
    "product_category_sequence_no" INTEGER NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("product_category_id")
);

-- CreateTable
CREATE TABLE "products" (
    "product_id" BIGSERIAL NOT NULL,
    "product_name" VARCHAR(255) NOT NULL,
    "product_description" VARCHAR(255),
    "product_sequence_no" INTEGER,
    "product_remarks" TEXT,
    "product_default_price" DECIMAL(10,2),
    "product_is_active" BOOLEAN DEFAULT true,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "product_category_id" BIGINT,

    CONSTRAINT "products_pkey" PRIMARY KEY ("product_id")
);

-- CreateTable
CREATE TABLE "refund_items" (
    "refund_item_id" BIGSERIAL NOT NULL,
    "refund_id" BIGINT,
    "invoice_item_id" BIGINT,
    "refund_quantity" INTEGER,
    "refund_item_amount" DECIMAL(10,2),
    "refund_item_remarks" TEXT,

    CONSTRAINT "refund_items_pkey" PRIMARY KEY ("refund_item_id")
);

-- CreateTable
CREATE TABLE "refunds" (
    "refund_id" BIGSERIAL NOT NULL,
    "invoice_id" BIGINT,
    "refund_total_amount" DECIMAL(10,2),
    "refund_remarks" TEXT,
    "refund_date" TIMESTAMPTZ(6),
    "employee_id" BIGINT,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("refund_id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" BIGSERIAL NOT NULL,
    "role_id_fk" BIGINT NOT NULL,
    "permission_id" BIGINT NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "roles" (
    "role_id" BIGSERIAL NOT NULL,
    "role_name" VARCHAR(20) NOT NULL,
    "description" VARCHAR(50) NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "service" (
    "service_id" BIGSERIAL NOT NULL,
    "service_name" VARCHAR(255) NOT NULL,
    "service_description" VARCHAR(255),
    "service_remarks" TEXT,
    "service_estimated_duration" DECIMAL NOT NULL,
    "service_default_price" DECIMAL(10,2) NOT NULL,
    "service_is_active" BOOLEAN NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "service_category_id" BIGINT NOT NULL,
    "service_sequence_no" INTEGER NOT NULL,

    CONSTRAINT "service_pkey" PRIMARY KEY ("service_id")
);

-- CreateTable
CREATE TABLE "service_categories" (
    "service_category_id" BIGSERIAL NOT NULL,
    "service_category_name" VARCHAR(255) NOT NULL,
    "service_category_sequence_no" INTEGER,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_categories_pkey1" PRIMARY KEY ("service_category_id")
);

-- CreateTable
CREATE TABLE "serving_employee_to_invoice_items" (
    "serving_employee_to_invoice_items_id" BIGSERIAL NOT NULL,
    "commission_percentage" DECIMAL(10,2),
    "custom_commission_percentage" DECIMAL(10,2),
    "final_calculated_commission_value" DECIMAL(10,2),
    "reward_status" VARCHAR(10),
    "rewarded_for_period_month" SMALLINT,
    "rewarded_for_period_year" SMALLINT,
    "system_generated_remarks" TEXT,
    "user_remarks" TEXT,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invoice_item_id" BIGINT NOT NULL,
    "reviewed_by_employee_id" BIGINT,
    "sharing_ratio" DECIMAL,
    "employee_id" BIGINT,
    "final_revenue_performance" DECIMAL,

    CONSTRAINT "serving_employee_to_invoice_items_pkey" PRIMARY KEY ("serving_employee_to_invoice_items_id")
);

-- CreateTable
CREATE TABLE "status" (
    "status_id" BIGSERIAL NOT NULL,
    "status_name" VARCHAR(50) NOT NULL,
    "status_description" VARCHAR(255),
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "status_pkey" PRIMARY KEY ("status_id")
);

-- CreateTable
CREATE TABLE "stored_value_accounts" (
    "stored_value_accounts_id" BIGSERIAL NOT NULL,
    "stored_value_accounts_balance" DECIMAL(10,2) NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "member_id" BIGINT NOT NULL,

    CONSTRAINT "stored_value_accounts_pkey" PRIMARY KEY ("stored_value_accounts_id")
);

-- CreateTable
CREATE TABLE "stored_value_transactions_logs" (
    "stored_value_transactions_logs_id" BIGSERIAL NOT NULL,
    "stored_value_account_id" BIGINT NOT NULL,
    "transaction_type" VARCHAR(50) NOT NULL,
    "balance_change_amount" DECIMAL,
    "remarks" VARCHAR(100),
    "created_at_utc" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "balance_after" DECIMAL,

    CONSTRAINT "stored_value_transactions_logs_pkey" PRIMARY KEY ("stored_value_transactions_logs_id")
);

-- CreateTable
CREATE TABLE "task_queue" (
    "task_queue_id" BIGSERIAL NOT NULL,
    "task_name" VARCHAR(50) NOT NULL,
    "table_name" VARCHAR(100) NOT NULL,
    "employee_id" BIGINT NOT NULL,
    "status_id" BIGINT NOT NULL,
    "payload" JSONB,
    "serviceService_id" BIGINT,
    "record_id" BIGINT NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_queue_pkey" PRIMARY KEY ("task_queue_id")
);

-- CreateTable
CREATE TABLE "translation" (
    "id" SERIAL NOT NULL,
    "english" VARCHAR(255) NOT NULL,
    "chinese" VARCHAR(255) NOT NULL,
    "created_at_utc" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at_utc" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "translation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_auth" (
    "user_id" BIGSERIAL NOT NULL,
    "employee_id" BIGINT NOT NULL,
    "password" VARCHAR(72) NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_auth_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" BIGINT NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role_permission_id" BIGINT NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("role_permission_id","user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "members_member_email_key" ON "members"("member_email");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_id_fk_permission_id_key" ON "role_permissions"("role_id_fk", "permission_id");

-- CreateIndex
CREATE INDEX "fki_service_service_category_id_fkey" ON "service"("service_category_id");

-- CreateIndex
CREATE UNIQUE INDEX "status_status_name_key" ON "status"("status_name");

-- CreateIndex
CREATE UNIQUE INDEX "user_auth_employee_id_key" ON "user_auth"("employee_id");

-- AddForeignKey
ALTER TABLE "audit_creation_log" ADD CONSTRAINT "audit_creation_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "employees"("employee_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "audit_deletion_log" ADD CONSTRAINT "audit_deletion_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "employees"("employee_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "audit_modification_log" ADD CONSTRAINT "audit_modification_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "employees"("employee_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "care_package" ADD CONSTRAINT "care_package_care_package_status_fkey" FOREIGN KEY ("care_package_status") REFERENCES "status"("status_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_package_item_details" ADD CONSTRAINT "care_package_item_details_care_package_id_fkey" FOREIGN KEY ("care_package_id") REFERENCES "care_package"("care_package_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_package_item_details" ADD CONSTRAINT "fk_service" FOREIGN KEY ("service_id") REFERENCES "service"("service_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_package_items" ADD CONSTRAINT "care_package_items_care_package_id_fkey" FOREIGN KEY ("care_package_id") REFERENCES "care_package"("care_package_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_performance_incentive_rules" ADD CONSTRAINT "employee_performance_incentive_rule_application_type_id_fkey" FOREIGN KEY ("application_type_id") REFERENCES "application_type"("application_type_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "department"("department_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "fk_position_id" FOREIGN KEY ("position_id") REFERENCES "position"("position_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("invoice_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "invoice_payment" ADD CONSTRAINT "invoice_payment_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("invoice_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "invoice_payment" ADD CONSTRAINT "invoice_payment_invoice_payment_created_by_fkey" FOREIGN KEY ("invoice_payment_created_by") REFERENCES "employees"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_payment" ADD CONSTRAINT "invoice_payment_invoice_payment_updated_by_fkey" FOREIGN KEY ("invoice_payment_updated_by") REFERENCES "employees"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_payment" ADD CONSTRAINT "invoice_payment_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payment_method"("payment_method_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_invoice_handler_employee_id_fkey" FOREIGN KEY ("invoice_handler_employee_id") REFERENCES "employees"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_invoice_status_fkey" FOREIGN KEY ("invoice_status") REFERENCES "status"("status_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("member_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_care_package" ADD CONSTRAINT "member_care_package_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_care_package" ADD CONSTRAINT "member_care_package_member_care_package_status_fkey" FOREIGN KEY ("member_care_package_status") REFERENCES "status"("status_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_care_package" ADD CONSTRAINT "member_care_package_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("member_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_care_package_details" ADD CONSTRAINT "member_care_package_details_member_care_package_id_fkey" FOREIGN KEY ("member_care_package_id") REFERENCES "member_care_package"("member_care_package_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_care_package_details" ADD CONSTRAINT "member_care_package_details_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "service"("service_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_care_package_details" ADD CONSTRAINT "member_care_package_details_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "status"("status_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_care_package_items_logs" ADD CONSTRAINT "member_care_package_items_logs_member_care_package_details_fkey" FOREIGN KEY ("member_care_package_details_id") REFERENCES "member_care_package_details"("member_care_package_details_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_care_package_transaction_logs" ADD CONSTRAINT "member_care_package_transaction_logs_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_care_package_transaction_logs" ADD CONSTRAINT "member_care_package_transaction_logs_member_care_package_d_fkey" FOREIGN KEY ("member_care_package_details_id") REFERENCES "member_care_package_details"("member_care_package_details_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_accounts" ADD CONSTRAINT "fk_member_id" FOREIGN KEY ("member_id") REFERENCES "members"("member_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "membership_accounts" ADD CONSTRAINT "fk_membership_type_id" FOREIGN KEY ("membership_type_id") REFERENCES "membership_type"("membership_type_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "membership_accounts" ADD CONSTRAINT "fk_status_id" FOREIGN KEY ("status_id") REFERENCES "status"("status_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "membership_history" ADD CONSTRAINT "membership_history_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("member_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_history" ADD CONSTRAINT "membership_history_new_membership_type_id_fkey" FOREIGN KEY ("new_membership_type_id") REFERENCES "membership_type"("membership_type_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_history" ADD CONSTRAINT "membership_history_old_membership_type_id_fkey" FOREIGN KEY ("old_membership_type_id") REFERENCES "membership_type"("membership_type_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_type" ADD CONSTRAINT "membership_type_account_creation_performance_rule_id_fkey" FOREIGN KEY ("account_stored_value_top_up_commission_rule_id") REFERENCES "employee_performance_incentive_rules"("employee_performance_incentive_rules_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "position" ADD CONSTRAINT "position_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "department"("department_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_product_category_id_fkey" FOREIGN KEY ("product_category_id") REFERENCES "product_categories"("product_category_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund_items" ADD CONSTRAINT "fk_refund_items_invoice_item_id" FOREIGN KEY ("invoice_item_id") REFERENCES "invoice_items"("invoice_item_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "refund_items" ADD CONSTRAINT "fk_refund_items_refund_id" FOREIGN KEY ("refund_id") REFERENCES "refunds"("refund_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "fk_refunds_invoice_id" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("invoice_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "fk_employee" FOREIGN KEY ("employee_id") REFERENCES "employees"("employee_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("permission_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fk_fkey" FOREIGN KEY ("role_id_fk") REFERENCES "roles"("role_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service" ADD CONSTRAINT "service_categories_service_category_id_fkey" FOREIGN KEY ("service_category_id") REFERENCES "service_categories"("service_category_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serving_employee_to_invoice_items" ADD CONSTRAINT "serving_employee_to_invoice_ite_reviewed_by_employee_id_fkey" FOREIGN KEY ("reviewed_by_employee_id") REFERENCES "employees"("employee_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serving_employee_to_invoice_items" ADD CONSTRAINT "serving_employee_to_invoice_items_invoice_item_id_fkey" FOREIGN KEY ("invoice_item_id") REFERENCES "invoice_items"("invoice_item_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stored_value_accounts" ADD CONSTRAINT "fk_stored_value_accounts_member_id" FOREIGN KEY ("member_id") REFERENCES "members"("member_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stored_value_transactions_logs" ADD CONSTRAINT "stored_value_transactions_logs_stored_value_account_id_fkey" FOREIGN KEY ("stored_value_account_id") REFERENCES "stored_value_accounts"("stored_value_accounts_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "task_queue" ADD CONSTRAINT "task_queue_serviceService_id_fkey" FOREIGN KEY ("serviceService_id") REFERENCES "service"("service_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_queue" ADD CONSTRAINT "task_queue_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_queue" ADD CONSTRAINT "task_queue_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "status"("status_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_auth" ADD CONSTRAINT "user_auth_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_permission_id_fkey" FOREIGN KEY ("role_permission_id") REFERENCES "role_permissions"("role_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_auth"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
