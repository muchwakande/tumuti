export interface Payment {
  id: number;
  meeting_id: number;
  meeting_label: string;
  member_id: number;
  member_name: string;
  amount: number;
  method: 'cash' | 'mpesa';
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentCreate {
  meeting_id: number;
  member_id: number;
  amount: number;
  method: 'cash' | 'mpesa';
  notes?: string;
}

export interface PaymentSummary {
  total_collected: number;
  total_saved: number;
  total_to_host: number;
  payment_count: number;
}

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'mpesa', label: 'MPESA' },
] as const;
