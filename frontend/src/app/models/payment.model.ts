export interface Payment {
  id: number;
  member_id: number;
  member_name: string;
  amount: number;
  method: 'cash' | 'mpesa';
  notes: string;
  target_type: 'meeting' | 'welfare_event';
  meeting_id: number | null;
  meeting_label: string | null;
  welfare_event_id: number | null;
  welfare_event_label: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentCreate {
  member_id: number;
  amount: number;
  method: 'cash' | 'mpesa';
  notes?: string;
  meeting_id?: number | null;
  welfare_event_id?: number | null;
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
