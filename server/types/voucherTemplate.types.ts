export interface VoucherTemplate {
  id?: number;
  voucher_template_name: string;
  default_starting_balance?: number;
  default_free_of_charge?: number;
  default_total_price?: number;
  remarks?: string;
  status?: string;
  created_by?: string;
  last_updated_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface VoucherTemplateDetail {
  id?: number;
  voucher_template_id: string;
  service_id: string;
  service_name: string;
  original_price: number;
  custom_price: number;
  discount: number;
  final_price: number;
  duration: number;
  service_category_id?: string;
}

export interface CreateVoucherTemplateInput {
  voucher_template_name: string;
  default_starting_balance?: number;
  default_free_of_charge?: number;
  default_total_price?: number;
  remarks?: string;
  status?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  details?: Omit<VoucherTemplateDetail, 'id' | 'voucher_template_id'>[];
}

export interface UpdateVoucherTemplateInput {
  id: number;
  voucher_template_name?: string;
  default_starting_balance?: number;
  default_free_of_charge?: number;
  default_total_price?: number;
  remarks?: string;
  status?: string;
  last_updated_by?: string;
  updated_at?: string;
  details?: Omit<VoucherTemplateDetail, 'voucher_template_id'>[];
}