export interface CreateTimetableInput {
  employee_id: number;
  current_date: string; // ISO string (e.g., from simulation or new Date())
  rest_day_number: number;
  effective_start_date: string;
  effective_end_date?: string | null;
  created_by: number;
  created_at: string;
}

export interface UpdateTimetableInput {
  timetable_id: number;
  current_date: string; // ISO string (e.g., from simulation or new Date())
  rest_day_number: number;
  effective_start_date: string;
  effective_end_date?: string | null;
  updated_by: number;
  updated_at: string;
}
