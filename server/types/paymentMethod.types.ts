// src/types/paymentMethod.types.ts

export interface CreatePaymentMethodInput {
  payment_method_name: string;
  is_enabled: boolean;
  is_revenue: boolean;
  show_on_payment_page: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdatePaymentMethodInput extends CreatePaymentMethodInput {
  id: number;
}
