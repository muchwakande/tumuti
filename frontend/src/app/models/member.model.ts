export interface FamilyMember {
  id: number;
  name: string;
  email: string | null;
  phone: string;
  is_host: boolean;
  parent_id: number | null;
  spouse_id: number | null;
  spouse_name: string | null;
  is_active: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface FamilyMemberTree {
  id: number;
  name: string;
  email: string | null;
  phone: string;
  is_host: boolean;
  is_active: boolean;
  parent_id: number | null;
  spouse_id: number | null;
  spouse_name: string | null;
  children: FamilyMemberTree[];
}

export interface FamilyMemberCreate {
  name: string;
  email?: string | null;
  phone: string;
  is_host?: boolean;
  parent_id?: number | null;
  spouse_id?: number | null;
  is_active?: boolean;
  notes?: string;
}

export interface FamilyMemberUpdate {
  name?: string;
  email?: string | null;
  phone?: string;
  is_host?: boolean;
  parent_id?: number | null;
  spouse_id?: number | null;
  clear_spouse?: boolean;
  is_active?: boolean;
  notes?: string;
}

export interface BulkUploadError {
  row: number;
  message: string;
}

export interface BulkUploadResult {
  created_count: number;
  skipped_count: number;
  errors: BulkUploadError[];
}
