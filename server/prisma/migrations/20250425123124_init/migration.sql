-- CreateEnum
CREATE TYPE "cs_customer_type" AS ENUM ('Member', 'Walk_In_Customer');

-- CreateEnum
CREATE TYPE "cs_item_type" AS ENUM ('Product', 'Service', 'Member_Care_Package', 'Membership_Account');

-- CreateTable
CREATE TABLE "cs_application_type" (
    "application_type_id" BIGSERIAL NOT NULL,
    "application_type" VARCHAR(50) NOT NULL,
    "remarks" TEXT,

    CONSTRAINT "cs_application_type_pkey" PRIMARY KEY ("application_type_id")
);

-- CreateTable
CREATE TABLE "cs_audit_creation_log" (
    "log_id" BIGSERIAL NOT NULL,
    "user_id" BIGINT,
    "table_name" VARCHAR(50),
    "record_id" BIGINT,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data" JSONB,

    CONSTRAINT "cs_audit_creation_log_pkey" PRIMARY KEY ("log_id")
);

-- CreateTable
CREATE TABLE "cs_audit_deletion_log" (
    "log_id" BIGSERIAL NOT NULL,
    "user_id" BIGINT,
    "table_name" VARCHAR(50),
    "record_id" BIGINT,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_data" JSONB,

    CONSTRAINT "cs_audit_deletion_log_pkey" PRIMARY KEY ("log_id")
);

-- CreateTable
CREATE TABLE "cs_audit_modification_log" (
    "log_id" BIGSERIAL NOT NULL,
    "user_id" BIGINT,
    "table_name" VARCHAR(50),
    "record_id" BIGINT,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "old_data" JSONB,
    "new_data" JSONB,
    "changed_fields" JSONB,

    CONSTRAINT "cs_audit_modification_log_pkey" PRIMARY KEY ("log_id")
);

-- CreateTable
CREATE TABLE "cs_care_package" (
    "care_package_id" BIGSERIAL NOT NULL,
    "care_package_name" VARCHAR(200) NOT NULL,
    "care_package_remarks" TEXT,
    "care_package_price" DECIMAL(10,2) NOT NULL,
    "care_package_status" BIGINT NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "care_package_customizable" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "cs_care_package_pkey" PRIMARY KEY ("care_package_id")
);

-- CreateTable
CREATE TABLE "cs_care_package_item_details" (
    "care_package_item_details_id" BIGSERIAL NOT NULL,
    "care_package_item_details_quantity" INTEGER NOT NULL,
    "care_package_item_details_discount" DECIMAL(10,2) NOT NULL,
    "care_package_item_details_price" DECIMAL(10,2) NOT NULL,
    "service_id" BIGINT NOT NULL,
    "care_package_id" BIGINT NOT NULL,

    CONSTRAINT "cs_care_package_item_details_pkey" PRIMARY KEY ("care_package_item_details_id")
);

-- CreateTable
CREATE TABLE "cs_care_package_items" (
    "care_package_items_id" BIGSERIAL NOT NULL,
    "care_package_id" BIGINT NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cs_care_package_items_pkey" PRIMARY KEY ("care_package_items_id")
);

-- CreateTable
CREATE TABLE "cs_department" (
    "department_id" BIGSERIAL NOT NULL,
    "department_name" VARCHAR(200) NOT NULL,
    "department_description" VARCHAR(255),
    "department_is_active" BOOLEAN NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at_utc" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cs_department_pkey" PRIMARY KEY ("department_id")
);

-- CreateTable
CREATE TABLE "cs_employee_performance_incentive_rules" (
    "employee_performance_incentive_rules_id" BIGSERIAL NOT NULL,
    "application_type_id" BIGINT,
    "percentage_value" DECIMAL,
    "absolute_value" DECIMAL,
    "remarks" TEXT,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cs_employee_performance_incentive_rules_pkey" PRIMARY KEY ("employee_performance_incentive_rules_id")
);

-- CreateTable
CREATE TABLE "cs_employees" (
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

    CONSTRAINT "cs_employees_pkey" PRIMARY KEY ("employee_id")
);

-- CreateTable
CREATE TABLE "cs_invoice_items" (
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
    "item_type" "cs_item_type" NOT NULL,

    CONSTRAINT "cs_invoice_items_pkey" PRIMARY KEY ("invoice_item_id")
);

-- CreateTable
CREATE TABLE "cs_invoice_payment" (
    "invoice_payment_id" BIGSERIAL NOT NULL,
    "payment_method_id" BIGINT NOT NULL,
    "invoice_id" BIGINT NOT NULL,
    "invoice_payment_amount" DECIMAL(10,2),
    "remarks" TEXT,
    "invoice_payment_created_by" BIGINT NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invoice_payment_updated_by" BIGINT NOT NULL,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cs_invoice_payment_pkey" PRIMARY KEY ("invoice_payment_id")
);

-- CreateTable
CREATE TABLE "cs_invoices" (
    "invoice_id" BIGSERIAL NOT NULL,
    "customer_type" "cs_customer_type" NOT NULL,
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

    CONSTRAINT "cs_invoices_pkey" PRIMARY KEY ("invoice_id")
);

-- CreateTable
CREATE TABLE "cs_member_care_package" (
    "member_care_package_id" BIGSERIAL NOT NULL,
    "member_id" BIGINT NOT NULL,
    "employee_id" BIGINT NOT NULL,
    "care_package_name" VARCHAR(100) NOT NULL,
    "member_care_package_status" BIGINT NOT NULL,
    "member_care_package_total_amount" DECIMAL(10,2) NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "care_package_remarks" VARCHAR(255),

    CONSTRAINT "cs_member_care_package_pkey" PRIMARY KEY ("member_care_package_id")
);

-- CreateTable
CREATE TABLE "cs_member_care_package_details" (
    "member_care_package_details_id" BIGSERIAL NOT NULL,
    "member_care_package_details_discount" DECIMAL(10,2) NOT NULL,
    "member_care_package_details_price" DECIMAL(10,2) NOT NULL,
    "member_care_package_id" BIGINT NOT NULL,
    "service_id" BIGINT,
    "status_id" BIGINT NOT NULL,

    CONSTRAINT "cs_member_care_package_details_pkey" PRIMARY KEY ("member_care_package_details_id")
);

-- CreateTable
CREATE TABLE "cs_member_care_package_items_logs" (
    "member_care_package_items_logs_id" BIGSERIAL NOT NULL,
    "member_care_package_items_logs_type" VARCHAR(100) NOT NULL,
    "member_care_package_item_logs_description" TEXT NOT NULL,
    "member_care_package_item_status" BIGINT NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "member_care_package_details_id" BIGINT NOT NULL,

    CONSTRAINT "cs_member_care_package_items_logs_pkey" PRIMARY KEY ("member_care_package_items_logs_id")
);

-- CreateTable
CREATE TABLE "cs_member_care_package_transaction_logs" (
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

    CONSTRAINT "cs_member_care_package_transaction_logs_pkey" PRIMARY KEY ("member_care_package_transaction_log_id")
);

-- CreateTable
CREATE TABLE "cs_members" (
    "member_id" BIGSERIAL NOT NULL,
    "member_name" VARCHAR(200) NOT NULL,
    "member_email" VARCHAR(150) NOT NULL,
    "member_contact" CHAR(8),
    "member_sex" CHAR(1),
    "member_dob" DATE NOT NULL,
    "remarks" TEXT,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cs_members_pkey" PRIMARY KEY ("member_id")
);

-- CreateTable
CREATE TABLE "cs_membership_accounts" (
    "membership_accounts_id" BIGSERIAL NOT NULL,
    "member_id" BIGINT NOT NULL,
    "membership_type_id" BIGINT NOT NULL,
    "start_date" TIMESTAMP(6) NOT NULL,
    "end_date" TIMESTAMP(6),
    "is_active" BOOLEAN NOT NULL,
    "created_at_utc" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at_utc" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status_id" BIGINT NOT NULL,

    CONSTRAINT "cs_membership_accounts_pkey" PRIMARY KEY ("membership_accounts_id")
);

-- CreateTable
CREATE TABLE "cs_membership_history" (
    "membership_history_id" BIGSERIAL NOT NULL,
    "member_id" BIGINT NOT NULL,
    "old_membership_type_id" BIGINT,
    "new_membership_type_id" BIGINT,
    "remarks" TEXT,
    "created_at_utc" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cs_membership_history_pkey" PRIMARY KEY ("membership_history_id")
);

-- CreateTable
CREATE TABLE "cs_membership_type" (
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

    CONSTRAINT "cs_membership_type_pkey" PRIMARY KEY ("membership_type_id")
);

-- CreateTable
CREATE TABLE "cs_payment_method" (
    "payment_method_id" BIGSERIAL NOT NULL,
    "payment_method_name" VARCHAR(50) NOT NULL,
    "is_active" BOOLEAN,
    "is_used_to_create_pending_invoice" BOOLEAN,
    "is_used_to_deduct_from_package" BOOLEAN,
    "is_revenue" BOOLEAN,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cs_payment_method_pkey" PRIMARY KEY ("payment_method_id")
);

-- CreateTable
CREATE TABLE "cs_permissions" (
    "permission_id" BIGSERIAL NOT NULL,
    "read_access" BOOLEAN NOT NULL,
    "update_access" BOOLEAN NOT NULL,
    "create_access" BOOLEAN NOT NULL,
    "delete_access" BOOLEAN NOT NULL,

    CONSTRAINT "cs_permissions_pkey" PRIMARY KEY ("permission_id")
);

-- CreateTable
CREATE TABLE "cs_position" (
    "position_id" BIGSERIAL NOT NULL,
    "position_name" VARCHAR(255) NOT NULL,
    "position_description" VARCHAR(255),
    "position_is_active" BOOLEAN DEFAULT true,
    "default_commission_percentage" DECIMAL(10,2),
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "department_id" BIGINT NOT NULL,

    CONSTRAINT "cs_position_pkey" PRIMARY KEY ("position_id")
);

-- CreateTable
CREATE TABLE "cs_product_categories" (
    "product_category_id" BIGSERIAL NOT NULL,
    "product_category_name" VARCHAR(255) NOT NULL,
    "product_category_sequence_no" INTEGER NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cs_product_categories_pkey" PRIMARY KEY ("product_category_id")
);

-- CreateTable
CREATE TABLE "cs_products" (
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

    CONSTRAINT "cs_products_pkey" PRIMARY KEY ("product_id")
);

-- CreateTable
CREATE TABLE "cs_refund_items" (
    "refund_item_id" BIGSERIAL NOT NULL,
    "refund_id" BIGINT,
    "invoice_item_id" BIGINT,
    "refund_quantity" INTEGER,
    "refund_item_amount" DECIMAL(10,2),
    "refund_item_remarks" TEXT,

    CONSTRAINT "cs_refund_items_pkey" PRIMARY KEY ("refund_item_id")
);

-- CreateTable
CREATE TABLE "cs_refunds" (
    "refund_id" BIGSERIAL NOT NULL,
    "invoice_id" BIGINT,
    "refund_total_amount" DECIMAL(10,2),
    "refund_remarks" TEXT,
    "refund_date" TIMESTAMPTZ(6),
    "employee_id" BIGINT,

    CONSTRAINT "cs_refunds_pkey" PRIMARY KEY ("refund_id")
);

-- CreateTable
CREATE TABLE "cs_role_permissions" (
    "role_id" BIGINT NOT NULL,
    "permission_id" BIGINT NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role_permission_id" BIGSERIAL NOT NULL,

    CONSTRAINT "cs_role_permissions_pkey" PRIMARY KEY ("role_permission_id")
);

-- CreateTable
CREATE TABLE "cs_roles" (
    "role_id" BIGSERIAL NOT NULL,
    "role_name" VARCHAR(20) NOT NULL,
    "description" VARCHAR(50) NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cs_roles_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "cs_service" (
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

    CONSTRAINT "cs_service_pkey" PRIMARY KEY ("service_id")
);

-- CreateTable
CREATE TABLE "cs_service_categories" (
    "service_category_id" BIGSERIAL NOT NULL,
    "service_category_name" VARCHAR(255) NOT NULL,
    "service_category_sequence_no" INTEGER,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cs_service_categories_pkey1" PRIMARY KEY ("service_category_id")
);

-- CreateTable
CREATE TABLE "cs_serving_employee_to_invoice_items" (
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

    CONSTRAINT "cs_serving_employee_to_invoice_items_pkey" PRIMARY KEY ("serving_employee_to_invoice_items_id")
);

-- CreateTable
CREATE TABLE "cs_status" (
    "status_id" BIGSERIAL NOT NULL,
    "status_name" VARCHAR(50) NOT NULL,
    "status_description" VARCHAR(255),
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cs_status_pkey" PRIMARY KEY ("status_id")
);

-- CreateTable
CREATE TABLE "cs_stored_value_accounts" (
    "stored_value_accounts_id" BIGSERIAL NOT NULL,
    "stored_value_accounts_balance" DECIMAL(10,2) NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "member_id" BIGINT NOT NULL,

    CONSTRAINT "cs_stored_value_accounts_pkey" PRIMARY KEY ("stored_value_accounts_id")
);

-- CreateTable
CREATE TABLE "cs_stored_value_transactions_logs" (
    "stored_value_transactions_logs_id" BIGSERIAL NOT NULL,
    "stored_value_account_id" BIGINT NOT NULL,
    "transaction_type" VARCHAR(50) NOT NULL,
    "balance_change_amount" DECIMAL,
    "remarks" VARCHAR(100),
    "created_at_utc" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "balance_after" DECIMAL,

    CONSTRAINT "cs_stored_value_transactions_logs_pkey" PRIMARY KEY ("stored_value_transactions_logs_id")
);

-- CreateTable
CREATE TABLE "cs_task_queue" (
    "task_queue_id" BIGSERIAL NOT NULL,
    "task_name" VARCHAR(50) NOT NULL,
    "table_name" VARCHAR(100) NOT NULL,
    "employee_id" BIGINT NOT NULL,
    "status_id" BIGINT NOT NULL,
    "payload" JSONB,
    "cs_serviceService_id" BIGINT,
    "record_id" BIGINT NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cs_task_queue_pkey" PRIMARY KEY ("task_queue_id")
);

-- CreateTable
CREATE TABLE "cs_translation" (
    "id" SERIAL NOT NULL,
    "english" VARCHAR(255) NOT NULL,
    "chinese" VARCHAR(255) NOT NULL,
    "created_at_utc" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at_utc" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cs_translation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cs_user_auth" (
    "user_id" BIGSERIAL NOT NULL,
    "employee_id" BIGINT NOT NULL,
    "password" VARCHAR(72) NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cs_user_auth_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "cs_user_roles" (
    "user_id" BIGINT NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role_permission_id" BIGINT NOT NULL,

    CONSTRAINT "cs_user_roles_pkey" PRIMARY KEY ("role_permission_id","user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cs_members_member_email_key" ON "cs_members"("member_email");

-- CreateIndex
CREATE INDEX "fki_cs_service_service_category_id_fkey" ON "cs_service"("service_category_id");

-- CreateIndex
CREATE UNIQUE INDEX "cs_status_status_name_key" ON "cs_status"("status_name");

-- CreateIndex
CREATE UNIQUE INDEX "cs_user_auth_employee_id_key" ON "cs_user_auth"("employee_id");

-- AddForeignKey
ALTER TABLE "cs_audit_creation_log" ADD CONSTRAINT "cs_audit_creation_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "cs_employees"("employee_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cs_audit_deletion_log" ADD CONSTRAINT "cs_audit_deletion_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "cs_employees"("employee_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cs_audit_modification_log" ADD CONSTRAINT "cs_audit_modification_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "cs_employees"("employee_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cs_care_package" ADD CONSTRAINT "cs_care_package_care_package_status_fkey" FOREIGN KEY ("care_package_status") REFERENCES "cs_status"("status_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cs_care_package_item_details" ADD CONSTRAINT "cs_care_package_item_details_care_package_id_fkey" FOREIGN KEY ("care_package_id") REFERENCES "cs_care_package"("care_package_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cs_care_package_item_details" ADD CONSTRAINT "fk_service" FOREIGN KEY ("service_id") REFERENCES "cs_service"("service_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cs_care_package_items" ADD CONSTRAINT "cs_care_package_items_care_package_id_fkey" FOREIGN KEY ("care_package_id") REFERENCES "cs_care_package"("care_package_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cs_employee_performance_incentive_rules" ADD CONSTRAINT "cs_employee_performance_incentive_rule_application_type_id_fkey" FOREIGN KEY ("application_type_id") REFERENCES "cs_application_type"("application_type_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cs_employees" ADD CONSTRAINT "cs_employees_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "cs_department"("department_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cs_employees" ADD CONSTRAINT "fk_position_id" FOREIGN KEY ("position_id") REFERENCES "cs_position"("position_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cs_invoice_items" ADD CONSTRAINT "cs_invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "cs_invoices"("invoice_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cs_invoice_payment" ADD CONSTRAINT "cs_invoice_payment_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "cs_invoices"("invoice_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cs_invoice_payment" ADD CONSTRAINT "cs_invoice_payment_invoice_payment_created_by_fkey" FOREIGN KEY ("invoice_payment_created_by") REFERENCES "cs_employees"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cs_invoice_payment" ADD CONSTRAINT "cs_invoice_payment_invoice_payment_updated_by_fkey" FOREIGN KEY ("invoice_payment_updated_by") REFERENCES "cs_employees"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cs_invoice_payment" ADD CONSTRAINT "cs_invoice_payment_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "cs_payment_method"("payment_method_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cs_invoices" ADD CONSTRAINT "cs_invoices_invoice_handler_employee_id_fkey" FOREIGN KEY ("invoice_handler_employee_id") REFERENCES "cs_employees"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cs_invoices" ADD CONSTRAINT "cs_invoices_invoice_status_fkey" FOREIGN KEY ("invoice_status") REFERENCES "cs_status"("status_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cs_invoices" ADD CONSTRAINT "cs_invoices_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "cs_members"("member_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cs_member_care_package" ADD CONSTRAINT "cs_member_care_package_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "cs_employees"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cs_member_care_package" ADD CONSTRAINT "cs_member_care_package_member_care_package_status_fkey" FOREIGN KEY ("member_care_package_status") REFERENCES "cs_status"("status_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cs_member_care_package" ADD CONSTRAINT "cs_member_care_package_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "cs_members"("member_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cs_member_care_package_details" ADD CONSTRAINT "cs_member_care_package_details_member_care_package_id_fkey" FOREIGN KEY ("member_care_package_id") REFERENCES "cs_member_care_package"("member_care_package_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cs_member_care_package_details" ADD CONSTRAINT "cs_member_care_package_details_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "cs_service"("service_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cs_member_care_package_details" ADD CONSTRAINT "cs_member_care_package_details_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "cs_status"("status_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cs_member_care_package_items_logs" ADD CONSTRAINT "cs_member_care_package_items_logs_member_care_package_deta_fkey" FOREIGN KEY ("member_care_package_details_id") REFERENCES "cs_member_care_package_details"("member_care_package_details_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cs_member_care_package_transaction_logs" ADD CONSTRAINT "cs_member_care_package_transaction_logs_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "cs_employees"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cs_member_care_package_transaction_logs" ADD CONSTRAINT "cs_member_care_package_transaction_logs_member_care_packag_fkey" FOREIGN KEY ("member_care_package_details_id") REFERENCES "cs_member_care_package_details"("member_care_package_details_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cs_membership_accounts" ADD CONSTRAINT "fk_member_id" FOREIGN KEY ("member_id") REFERENCES "cs_members"("member_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cs_membership_accounts" ADD CONSTRAINT "fk_membership_type_id" FOREIGN KEY ("membership_type_id") REFERENCES "cs_membership_type"("membership_type_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cs_membership_accounts" ADD CONSTRAINT "fk_status_id" FOREIGN KEY ("status_id") REFERENCES "cs_status"("status_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cs_membership_history" ADD CONSTRAINT "cs_membership_history_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "cs_members"("member_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cs_membership_history" ADD CONSTRAINT "cs_membership_history_new_membership_type_id_fkey" FOREIGN KEY ("new_membership_type_id") REFERENCES "cs_membership_type"("membership_type_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cs_membership_history" ADD CONSTRAINT "cs_membership_history_old_membership_type_id_fkey" FOREIGN KEY ("old_membership_type_id") REFERENCES "cs_membership_type"("membership_type_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cs_membership_type" ADD CONSTRAINT "cs_membership_type_account_creation_performance_rule_id_fkey" FOREIGN KEY ("account_stored_value_top_up_commission_rule_id") REFERENCES "cs_employee_performance_incentive_rules"("employee_performance_incentive_rules_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cs_position" ADD CONSTRAINT "cs_position_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "cs_department"("department_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cs_products" ADD CONSTRAINT "cs_products_product_category_id_fkey" FOREIGN KEY ("product_category_id") REFERENCES "cs_product_categories"("product_category_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cs_refund_items" ADD CONSTRAINT "fk_cs_refund_items_invoice_item_id" FOREIGN KEY ("invoice_item_id") REFERENCES "cs_invoice_items"("invoice_item_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cs_refund_items" ADD CONSTRAINT "fk_cs_refund_items_refund_id" FOREIGN KEY ("refund_id") REFERENCES "cs_refunds"("refund_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cs_refunds" ADD CONSTRAINT "fk_cs_refunds_invoice_id" FOREIGN KEY ("invoice_id") REFERENCES "cs_invoices"("invoice_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cs_refunds" ADD CONSTRAINT "fk_employee" FOREIGN KEY ("employee_id") REFERENCES "cs_employees"("employee_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cs_role_permissions" ADD CONSTRAINT "cs_role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "cs_permissions"("permission_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cs_role_permissions" ADD CONSTRAINT "cs_role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "cs_roles"("role_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cs_service" ADD CONSTRAINT "cs_service_categories_service_category_id_fkey" FOREIGN KEY ("service_category_id") REFERENCES "cs_service_categories"("service_category_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cs_serving_employee_to_invoice_items" ADD CONSTRAINT "cs_serving_employee_to_invoice_ite_reviewed_by_employee_id_fkey" FOREIGN KEY ("reviewed_by_employee_id") REFERENCES "cs_employees"("employee_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cs_serving_employee_to_invoice_items" ADD CONSTRAINT "cs_serving_employee_to_invoice_items_invoice_item_id_fkey" FOREIGN KEY ("invoice_item_id") REFERENCES "cs_invoice_items"("invoice_item_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cs_stored_value_accounts" ADD CONSTRAINT "fk_cs_stored_value_accounts_member_id" FOREIGN KEY ("member_id") REFERENCES "cs_members"("member_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cs_stored_value_transactions_logs" ADD CONSTRAINT "cs_stored_value_transactions_logs_stored_value_account_id_fkey" FOREIGN KEY ("stored_value_account_id") REFERENCES "cs_stored_value_accounts"("stored_value_accounts_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cs_task_queue" ADD CONSTRAINT "cs_task_queue_cs_serviceService_id_fkey" FOREIGN KEY ("cs_serviceService_id") REFERENCES "cs_service"("service_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cs_task_queue" ADD CONSTRAINT "cs_task_queue_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "cs_employees"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cs_task_queue" ADD CONSTRAINT "cs_task_queue_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "cs_status"("status_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cs_user_auth" ADD CONSTRAINT "cs_user_auth_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "cs_employees"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cs_user_roles" ADD CONSTRAINT "cs_user_roles_role_permission_id_fkey" FOREIGN KEY ("role_permission_id") REFERENCES "cs_role_permissions"("role_permission_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cs_user_roles" ADD CONSTRAINT "cs_user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "cs_user_auth"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
