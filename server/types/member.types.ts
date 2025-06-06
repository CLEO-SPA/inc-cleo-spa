export interface CreateMemberInput {
  name: string;
  email: string;
  contact: string;
  dob: string;
  sex: string;
  remarks: string;
  address: string;
  nric: string;
  membership_type_id: number | string;
  created_at: string;
  updated_at: string;
  created_by: number | string;
  role_id?: number;
}

export interface UpdateMemberInput {
  id: number | string;
  name?: string;
  email?: string;
  contact?: string;
  dob?: string;
  sex?: string;
  remarks?: string;
  address?: string;
  nric?: string;
  membership_type_id?: number | string;
  updated_at: string;
}