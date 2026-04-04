export interface Contribution {
  id: number;
  meeting_id: number;
  member_id: number;
  member_name: string;
  amount: number;
  saved_amount: number;
  host_amount: number;
  notes: string;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface ContributionCreate {
  meeting_id: number;
  member_id: number;
  amount: number;
  notes?: string;
  date: string;
}

export interface ContributionUpdate {
  amount?: number;
  notes?: string;
  date?: string;
}

export interface ContributionSummary {
  total_amount: number;
  total_saved: number;
  total_to_host: number;
  contribution_count: number;
}
