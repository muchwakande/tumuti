export interface Meeting {
  id: number;
  year: number;
  month: number;
  date: string;
  host_ids: number[];
  host_names: string[];
  status: 'scheduled' | 'completed' | 'cancelled';
  savings_percentage: number;
  expected_contribution: number;
  total_collected: number;
  total_saved: number;
  total_to_host: number;
  notes: string;
  minutes: string;
  created_at: string;
  updated_at: string;
}

export interface MeetingCreate {
  year: number;
  month: number;
  date: string;
  host_ids: number[];
  status?: string;
  savings_percentage?: number;
  notes?: string;
}

export interface MeetingUpdate {
  date?: string;
  host_ids?: number[];
  status?: string;
  savings_percentage?: number;
  notes?: string;
  minutes?: string;
}

export interface PaymentDetail {
  id: number;
  amount: number;
  method: 'cash' | 'mpesa';
  notes: string;
  created_at: string;
}

export interface MemberStatus {
  member_id: number;
  member_name: string;
  member_phone: string;
  is_host: boolean;
  attended: boolean;
  total_paid: number;
  balance: number;
  payments: PaymentDetail[];
}

export interface MeetingDetail extends Meeting {
  member_statuses: MemberStatus[];
}

export const MEETING_MONTHS = [
  { value: 4, label: 'April' },
  { value: 8, label: 'August' },
  { value: 12, label: 'December' },
];

export const MEETING_MONTH_NAMES: Record<number, string> = {
  4: 'April',
  8: 'August',
  12: 'December',
};
