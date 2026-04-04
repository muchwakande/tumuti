export interface Meeting {
  id: number;
  year: number;
  month: number;
  date: string;
  host_id: number;
  host_name: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  savings_percentage: number;
  total_contributions: number;
  total_saved: number;
  total_to_host: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface MeetingCreate {
  year: number;
  month: number;
  date: string;
  host_id: number;
  status?: string;
  savings_percentage?: number;
  notes?: string;
}

export interface MeetingUpdate {
  date?: string;
  host_id?: number;
  status?: string;
  savings_percentage?: number;
  notes?: string;
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
