// Member interfaces
export interface Member {
  id: string;
  name: string;
  email: string;
  contact: string;
}

// Payment interfaces
export interface Payment {
  amount: number;
  payment_method: string;
}

export interface PaymentDetail {
  id: string;
  amount: number;
  payment_method: string;
  created_at: Date;
  updated_at: Date;
  remarks: string;
  created_by: Employee;
  updated_by: Employee;
}

// Employee interface
export interface Employee {
  code: string;
  name: string;
}

// Enhanced Transaction Item interface with voucher and care package support
export interface TransactionItem {
  id: string;
  service_name: string | null;
  product_name: string | null;
  member_care_package_id: string | null;
  member_voucher_id: string | null;
  original_unit_price: number;
  custom_unit_price: number;
  discount_percentage: number;
  quantity: number;
  remarks: string;
  amount: number;
  item_type: string;
  
  // Enhanced voucher information
  member_voucher_name?: string;
  voucher_balance?: number;
  voucher_status?: 'is_enabled' | 'is_disabled' | 'expired';
  
  // Enhanced care package information
  care_package_name?: string;
  care_package_balance?: number;
  care_package_status?: 'is_enabled' | 'is_disabled' | 'completed';
}

export interface SalesTransaction {
  transaction_id: string;
  receipt_no: string;
  customer_type: string;
  total_transaction_amount: number;
  total_paid_amount: number;
  outstanding_total_payment_amount: number;
  transaction_status: string;
  transaction_created_at: Date;
  has_services: boolean;
  has_products: boolean;
  has_care_packages: boolean;
  process_payment: boolean;
  member: Member | null;
  payments: Payment[];
}

export interface SalesTransactionDetail extends SalesTransaction {
  transaction_updated_at: Date;
  transaction_remark: string;
  reference_sales_transaction_id: string | number | null;
  handler: Employee | null;
  creator: Employee | null;
  payments: PaymentDetail[];
  items: TransactionItem[];
}

// Pagination interfaces
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  totalPages: number;
  currentPage: number;
}

// Service and Product interfaces
export interface Service {
  id: string;
  service_id: string;
  name: string;
  service_name: string;
  description: string;
  remarks: string;
  duration: number;
  category: string;
  service_category_name: string;
  service_category_id: string | null;
  price: number;
  service_default_price: number;
  is_enabled: boolean;
  sequence_no: number;
}

export interface Product {
  id: string;
  product_id: string;
  name: string;
  product_name: string;
  description: string;
  remarks: string;
  category: string;
  product_category_name: string;
  product_category_id: string | null;
  price: number;
  cost_price: number;
  is_enabled: boolean;
  sequence_no: number;
}

export interface ItemPricing {
  originalPrice: number;
  customPrice: number;
  discount: number;
  quantity: number;
  totalLinePrice: number;
}

export interface ItemData {
  name: string;
  id?: string;
  [key: string]: any;
}

export interface TransactionRequestItem {
  type: 'service' | 'product';
  data: ItemData;
  pricing: ItemPricing;
  assignedEmployee?: number | string;
  employee_id?: number | string;
  remarks?: string;
  employeeRemarks?: string;
}

export interface PaymentMethodRequest {
  methodId: number | string; // Allow both number and string for special payment methods like 'transfer'
  amount: number;
  remark?: string;
}

export interface TransactionRequestData {
  customer_type?: string;
  member_id?: string | number;
  receipt_number?: string;
  remarks?: string;
  created_by: number;
  handled_by: number;
  items: TransactionRequestItem[];
  payments: PaymentMethodRequest[];
  created_at?: string;
  updated_at?: string;
}

export interface TransactionCreationResult {
  id: number;
  receipt_no: string;
  customer_type: string;
  member_id: string | number | null;
  total_transaction_amount: number;
  total_paid_amount: number;
  outstanding_total_payment_amount: number;
  transaction_status: 'FULL' | 'PARTIAL' | 'TRANSFER' | 'REFUND';
  remarks: string;
  created_by: number;
  handled_by: number;
  items_count: number;
  payments_count: number;
}

export interface SingleTransactionRequestItem {
  type: 'package' | 'member-voucher' | 'transfer' | 'transferMCP' | 'transferMV';
  data: {
    id: string;
    // Package-specific fields
    package_name?: string;
    name?: string;
    package_price?: number;
    template_package_id?: string;
    services?: any[];
    // Voucher-specific fields
    member_voucher_name?: string;
    starting_balance?: number;
    free_of_charge?: number;
    // Transfer-specific fields
    amount?: number;
    description?: string;
    queueItem?: {
      id: string;
      mcp_id1?: string | number;
      mcp_id2?: string | number;
      amount?: number;
      [key: string]: any;
    };
    // Common fields
    member_id?: number;
    employee_id?: number;
    [key: string]: any;
  };
  pricing: ItemPricing;
  assignedEmployee?: number | string;
  employee_id?: number | string;
  remarks?: string;
  employeeRemarks?: string;
}

export interface SingleItemTransactionRequestData {
  customer_type?: string;
  member_id?: number | number;
  receipt_number?: string;
  remarks?: string;
  created_by: number;
  handled_by: number;
  item: SingleTransactionRequestItem;
  payments: PaymentMethodRequest[];
  created_at?: string;
  updated_at?: string;
  newVoucherId?: number;
}

export interface SingleItemTransactionCreationResult {
  id: number;
  receipt_no: string;
  customer_type: string;
  member_id: string | number | null;
  total_transaction_amount: number;
  total_paid_amount: number;
  outstanding_total_payment_amount: number;
  transaction_status: 'FULL' | 'PARTIAL' | 'TRANSFER' | 'REFUND';
  remarks: string;
  created_by: number;
  handled_by: number;
  package_id?: number | null;
  package_name?: string | null;
  voucher_id?: number | null;
  voucher_name?: string | null;
  // Transfer-specific fields
  mcp_id1?: string | number | null;
  mcp_id2?: string | number | null;
  transfer_amount?: number;
  transfer_description?: string;
  items_count: number;
  payments_count: number;
}

export interface PartialPaymentRequest {
  payment_method_id: number;
  amount: number;
  remarks?: string;
  payment_handler_id: number;
}

export interface ProcessPartialPaymentData {
  payments: PartialPaymentRequest[];
  general_remarks?: string;
}

export interface PartialPaymentResult {
  new_transaction: {
    id: number;
    receipt_no: string;
    total_paid_amount: number;
    outstanding_amount: number;
    transaction_status: 'FULL' | 'PARTIAL';
    process_payment: boolean;
  };
  original_transaction: {
    id: number;
    receipt_no: string;
    process_payment: boolean;
  };
  payments_processed: number;
  total_payment_amount: number;
}

export interface ProcessPartialPaymentDataWithHandler extends ProcessPartialPaymentData {
  transaction_handler_id: number;
  payment_handler_id: number,
  receipt_number?: string
  created_at?: string;
}

// =====================================
// ENHANCED INTERFACES FOR VOUCHERS & CARE PACKAGES
// =====================================

// Member Voucher interfaces
export interface MemberVoucher {
  id: string;
  member_voucher_name: string;
  voucher_template_id: string;
  member_id: string;
  current_balance: number;
  starting_balance: number;
  free_of_charge: number;
  default_total_price: number;
  status: 'is_enabled' | 'is_disabled' | 'expired';
  remarks?: string;
  created_by: string;
  handled_by: string;
  last_updated_by: string;
  created_at: string;
  updated_at: string;
}

export interface VoucherTemplate {
  id: string;
  voucher_template_name: string;
  default_starting_balance: number;
  default_free_of_charge: number;
  default_total_price: number;
  remarks?: string;
  status: 'active' | 'inactive';
  created_by: string;
  last_updated_by: string;
  created_at: string;
  updated_at: string;
}

// Member Care Package interfaces
export interface MemberCarePackage {
  id: string;
  member_id: string;
  employee_id: string;
  package_name: string;
  status: 'is_enabled' | 'is_disabled' | 'completed';
  total_price: number;
  balance: number;
  created_at: string;
  updated_at: string;
  package_remarks?: string;
}

export interface CarePackageTemplate {
  id: string;
  package_name: string;
  description?: string;
  total_price: number;
  status: 'active' | 'inactive';
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Group structures for rendering in UI
export interface VoucherGroup {
  id: string;
  name?: string;
  balance?: number;
  status?: string;
  items: TransactionItem[];
}

export interface CarePackageGroup {
  id: string;
  name?: string;
  balance?: number;
  status?: string;
  items: TransactionItem[];
}

// Transaction Log interfaces
export interface MemberVoucherTransactionLog {
  id: string;
  member_voucher_id: string;
  service_description: string;
  service_date: string;
  current_balance: number;
  amount_change: number;
  serviced_by: string;
  type: 'PURCHASE' | 'CONSUMPTION' | 'FOC' | 'REFUND';
  created_by: string;
  last_updated_by: string;
  created_at: string;
  updated_at: string;
}

export interface MemberCarePackageTransactionLog {
  id: string;
  type: string;
  description: string;
  transaction_date: string;
  transaction_amount: number;
  amount_changed: number;
  created_at: string;
  member_care_package_details_id: string;
  employee_id: string;
  service_id?: string;
}

// API Response structures
export interface SalesTransactionResponse {
  success: boolean;
  message: string;
  data: SalesTransactionDetail;
}

export interface MemberVoucherResponse {
  success: boolean;
  message: string;
  data: MemberVoucher[];
}

export interface MemberCarePackageResponse {
  success: boolean;
  message: string;
  data: MemberCarePackage[];
}

// Form data structures for creating vouchers and care packages
export interface CreateMemberVoucherData {
  member_id: number;
  voucher_template_id: number;
  member_voucher_name: string;
  starting_balance: number;
  free_of_charge: number;
  default_total_price: number;
  remarks?: string;
  created_by: number;
  handled_by: number;
}

export interface CreateMemberCarePackageData {
  member_id: number;
  employee_id: number;
  package_name: string;
  total_price: number;
  balance: number;
  package_remarks?: string;
  services: Array<{
    service_id: number;
    service_name: string;
    price: number;
    quantity: number;
  }>;
}

// Enhanced item selection for transactions
export interface VoucherSelectionItem {
  id: string;
  name: string;
  balance: number;
  status: string;
  member_id: string;
  voucher_template_id: string;
}

export interface CarePackageSelectionItem {
  id: string;
  name: string;
  balance: number;
  status: string;
  member_id: string;
  total_price: number;
}

// Search and filter interfaces
export interface VoucherSearchFilters {
  member_id?: string;
  status?: 'is_enabled' | 'is_disabled' | 'expired';
  voucher_template_id?: string;
  date_from?: string;
  date_to?: string;
}

export interface CarePackageSearchFilters {
  member_id?: string;
  status?: 'is_enabled' | 'is_disabled' | 'completed';
  employee_id?: string;
  date_from?: string;
  date_to?: string;
}

// Dashboard/Summary interfaces
export interface VoucherSummary {
  total_vouchers: number;
  active_vouchers: number;
  total_balance: number;
  average_balance: number;
}

export interface CarePackageSummary {
  total_packages: number;
  active_packages: number;
  total_balance: number;
  average_balance: number;
}

// Error handling
export interface APIError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  code?: string;
}

// Generic API response wrapper
export interface APIResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
  meta?: {
    pagination?: {
      current_page: number;
      total_pages: number;
      total_items: number;
      per_page: number;
    };
  };
}