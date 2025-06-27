export interface Employees {
  id?: string;
  user_auth_id: string;
  department_id: string;
  employee_code: string;
  employee_contact: string;
  employee_email: string;
  employee_name: string;
  employee_is_active: boolean;
  verified_status_id: string;
  created_at: string;
  updated_at: string;
}

export interface CarePackages {
  id?: string;
  care_package_name: string;
  care_package_remarks: string;
  care_package_price: number;
  care_package_customizable: boolean;
  status: 'ENABLED' | 'DISABLED';
  created_by: string;
  last_updated_by: string;
  created_at: string;
  updated_at: string;
}

export interface CarePackageItemDetails {
  id?: string;
  care_package_item_details_quantity: number;
  care_package_item_details_discount: number;
  care_package_item_details_price: number;
  service_id: string;
  care_package_id: string;
}

export interface MemberCarePackages {
  id?: string;
  member_id: string;
  employee_id: string;
  package_name: string;
  status: 'ENABLED' | 'DISABLED';
  total_price: number;
  balance: number;
  created_at: string;
  updated_at: string;
  package_remarks: string;
}

export interface MemberCarePackagesDetails {
  id?: string;
  service_name: string;
  discount: number;
  price: number;
  member_care_package_id: string;
  service_id: string;
  status: 'ENABLED' | 'DISABLED';
  quantity: number;
}

export interface MemberCarePackageTransactionLogs {
  id?: string;
  type: 'PURCHASE' | 'CONSUMPTION';
  description: string;
  transaction_date: string;
  transaction_amount: number;
  amount_changed: number;
  member_care_package_details_id: string;
  employee_id: string;
  service_id: string;
  created_at: string;
}

export interface SystemParameters {
  id: string;
  start_date_utc: string;
  end_date_utc: string;
  is_simulation: boolean;
}

export interface MemberVouchers {
  id?: number;
  member_voucher_name: string;
  voucher_template_id: number;
  member_id: number;
  current_balance: number;
  starting_balance: number;
  free_of_charge: number;
  default_total_price: number;
  status: string;
  remarks: string;
  created_by: number;
  handled_by: number;
  last_updated_by: number;
  created_at: string;
  updated_at: string;
}

export interface MemberVoucherServices {
  id?: number;
  service_name: string;
  original_price: number;
  custom_price: number;
  discount: number;
  duration: number;
}

export interface MemberVoucherTransactionLogs {
  id?: number;
  member_voucher_id: number;
  service_description: string;
  service_date: string;
  current_balance: number;
  amount_change: number;
  serviced_by: number;
  type: string;
  created_by: number;
  updated_by: number;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: number;
  employee_name: string;
  position_id: number | null;
}

export interface MemberVoucherTransactionLogCreateData {
  id: number;
  consumptionValue: number;
  remarks: string;
  date: string;
  time: string;
  type: string;
  createdBy: number;
  handledBy: number;
  current_balance: number;
}

export interface MemberName {
  id?: number;
  member_name: string;
}

export interface MemberVoucherTransactionLogUpdateData {
  member_voucher_id: number;
  transaction_log_id: number;
  consumptionValue: number;
  remarks: string;
  date: string;
  time: string;
  type: string;
  createdBy: number;
  handledBy: number;
  lastUpdatedBy: number;
}

export interface MembershipType {
  id: number;
  membership_type_name: string;
  default_percentage_discount_for_products: number;
  default_percentage_discount_for_services: number;
  created_at: Date;
  updated_at: Date;
  created_by: number;
  last_updated_by: number;
}

// Data set for a new Membership Type
export type NewMembershipType = Pick<
  MembershipType,
  | 'membership_type_name'
  | 'default_percentage_discount_for_products'
  | 'default_percentage_discount_for_services'
  | 'created_by'
>;

// Data set for an updated Membership Type
export type UpdatedMembershipType = Omit<MembershipType, 'created_at' | 'updated_at'>;

export interface Positions {
  id?: string;
  position_name: string;
  position_description: string;
  position_is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DataToExportList<L> {
  dataToExportList: L[];
}

export interface UnusedMemberVoucherData {
  member_name: string;
  contact: string;
  email: string;
  member_voucher_name: string;
  days_since_use: number;
  created_at: Date;
}

export interface UnusedMemberCarePackageData {
  member_name: string;
  contact: string;
  email: string;
  member_care_package_name: string;
  days_since_use: number;
  created_at: Date;
}

export interface MemberDetailsData {
  member_id: number;
  name: string;
  email: string;
  contact: string;
  dob: Date;
  sex: string;
  remarks: string;
  address: string;
  nric: string;
}
