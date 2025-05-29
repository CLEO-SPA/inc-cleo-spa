/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Employees {
  id?: string;
  user_auth_id?: string;
  department_id?: string;
  position_id?: string;
  employee_code?: string;
  employee_contact?: string;
  employee_email?: string;
  employee_name?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface CarePackages {
  id?: string;
  care_package_name?: string;
  care_package_remarks?: string;
  care_package_price?: number;
  care_package_customizable?: boolean;
  status_id?: string;
  created_by?: string;
  last_updated_by?: string;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

export interface MemberCarePackages {
  id?: string;
  member_id?: string;
  employee_id?: string;
  package_name?: string;
  status_id?: string;
  total_price?: number;
  created_at?: string;
  updated_at?: string;
  package_remarks?: string;
  [key: string]: any;
}

export interface CarePackageItemDetails {
  id?: string;
  care_package_item_details_quantity?: number;
  care_package_item_details_discount?: number;
  care_package_item_details_price?: number;
  service_id?: string;
  care_package_id?: string;
}

export interface CarePackageItems {
  id?: string;
  care_package_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SystemParameters {
  id: string;
  start_date_utc: string;
  end_date_utc: string;
  is_simulation: boolean;
}
