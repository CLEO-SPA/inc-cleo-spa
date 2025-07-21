export interface CreateEmployeeData {
  employee_code: string;
  employee_name: string;
  employee_email?: string;
  employee_contact?: string;
  employee_is_active: boolean;
  position_ids: string[];
  created_at?: string;
  updated_at?: string;
}

export interface UpdateEmployeeData {
  employee_id: number;                // Required: ID of the employee to update
  employee_email?: string;            // Optional: new email
  employee_name?: string;             // Optional: new full name
  employee_contact?: string;          // Optional: new contact number
  employee_code?: string;             // Optional: new employee code
  employee_is_active?: boolean;       // Optional: active/inactive toggle
  position_ids?: number[];            // Optional: list of new position IDs (full replace)
  updated_at?: string;                // Optional: ISO timestamp (from frontend)
}

