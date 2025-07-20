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
  card_number: string;
  created_at: string;
  updated_at: string;
  created_by: number | string;
  role_id?: number;
}

export interface UpdateMemberInput extends Partial<CreateMemberInput> {
  id: number | string;
  updated_at: string; // override to keep it required
}
