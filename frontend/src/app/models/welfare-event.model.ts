import { PaymentDetail } from './meeting.model';

export type WelfareEventType = 'wedding' | 'graduation' | 'death';
export type PayoutStatus = 'pending' | 'paid';

export interface Payout {
  id: number;
  welfare_event_id: number;
  amount: number;
  status: PayoutStatus;
  paid_date: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface PayoutCreate {
  amount: number;
  status?: PayoutStatus;
  paid_date?: string | null;
  notes?: string;
}

export interface PayoutUpdate {
  amount?: number;
  status?: PayoutStatus;
  paid_date?: string | null;
  notes?: string;
}

export interface WelfareEvent {
  id: number;
  member_id: number;
  member_name: string;
  event_type: WelfareEventType;
  date: string;
  contribution_expected: number | null;
  total_contributed: number;
  notes: string;
  payout: Payout | null;
  created_at: string;
  updated_at: string;
}

export interface WelfareEventCreate {
  member_id: number;
  event_type: WelfareEventType;
  date: string;
  contribution_expected?: number | null;
  notes?: string;
}

export interface WelfareEventUpdate {
  member_id?: number;
  event_type?: WelfareEventType;
  date?: string;
  contribution_expected?: number | null;
  notes?: string;
}

export interface HostContributionStatus {
  member_id: number;
  member_name: string;
  total_paid: number;
  balance: number;
  payments: PaymentDetail[];
}

export interface WelfareEventDetail extends WelfareEvent {
  host_statuses: HostContributionStatus[];
}

export const WELFARE_EVENT_TYPES: { value: WelfareEventType; label: string }[] = [
  { value: 'wedding', label: 'Wedding' },
  { value: 'graduation', label: 'Graduation' },
  { value: 'death', label: 'Death' },
];

export const WELFARE_EVENT_TYPE_LABELS: Record<WelfareEventType, string> = {
  wedding: 'Wedding',
  graduation: 'Graduation',
  death: 'Death',
};
