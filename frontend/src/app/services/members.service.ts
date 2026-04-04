import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { FamilyMember, FamilyMemberCreate, FamilyMemberUpdate, FamilyMemberTree, BulkUploadResult } from '../models';

@Injectable({
  providedIn: 'root'
})
export class MembersService {
  private readonly apiUrl = `${environment.apiUrl}/members/`;

  constructor(private http: HttpClient) {}

  getMembers(filters?: { is_host?: boolean; is_active?: boolean }): Observable<FamilyMember[]> {
    let params = new HttpParams();
    if (filters?.is_host !== undefined) {
      params = params.set('is_host', filters.is_host.toString());
    }
    if (filters?.is_active !== undefined) {
      params = params.set('is_active', filters.is_active.toString());
    }
    return this.http.get<FamilyMember[]>(this.apiUrl, { params });
  }

  getFamilyTree(): Observable<FamilyMemberTree[]> {
    return this.http.get<FamilyMemberTree[]>(`${this.apiUrl}tree/`);
  }

  getMember(id: number): Observable<FamilyMember> {
    return this.http.get<FamilyMember>(`${this.apiUrl}${id}/`);
  }

  createMember(data: FamilyMemberCreate): Observable<FamilyMember> {
    return this.http.post<FamilyMember>(this.apiUrl, data);
  }

  updateMember(id: number, data: FamilyMemberUpdate): Observable<FamilyMember> {
    return this.http.patch<FamilyMember>(`${this.apiUrl}${id}/`, data);
  }

  deleteMember(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}${id}/`);
  }

  downloadTemplate(): void {
    this.http.get(`${this.apiUrl}template/`, { responseType: 'blob' }).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'members_template.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  bulkUpload(file: File): Observable<BulkUploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<BulkUploadResult>(`${this.apiUrl}bulk-upload/`, formData);
  }
}
