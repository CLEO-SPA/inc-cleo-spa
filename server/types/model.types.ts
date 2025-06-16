export interface Employees {
  id?: string;
  user_auth_id: string;
  department_id: string;
  employee_code: string;
  employee_contact: string;
  employee_email: string;
  employee_name: string;
  employee_is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SystemParameters {
  id: string;
  start_date_utc: string;
  end_date_utc: string;
  is_simulation: boolean;
}

export interface Positions {
  id?: string;
  position_name: string;
  position_description: string;
  position_is_active: boolean;
  position_created_at: string;
  position_updated_at: string;
}