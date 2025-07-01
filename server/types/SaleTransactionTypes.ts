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

// Transaction interfaces
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
  newVoucherId?: number; // ✅ add this

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
  created_at?: string;
}
