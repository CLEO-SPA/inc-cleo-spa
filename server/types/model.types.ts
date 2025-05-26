export interface Employees {
  id?: string;
  user_auth_id: string;
  department_id: string;
  position_id: string;
  employee_code: string;
  employee_contact: string;
  employee_email: string;
  employee_name: string;
  created_at: string;
  updated_at: string;
}

export interface SystemParameters {
  id: string;
  start_date_utc: string;
  end_date_utc: string;
  is_simulation: boolean;
}
