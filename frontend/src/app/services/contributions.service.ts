import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Contribution, ContributionCreate, ContributionUpdate, ContributionSummary } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ContributionsService {
  private readonly apiUrl = `${environment.apiUrl}/contributions/`;

  constructor(private http: HttpClient) {}

  getContributions(filters?: { meeting_id?: number; member_id?: number }): Observable<Contribution[]> {
    let params = new HttpParams();
    if (filters?.meeting_id !== undefined) {
      params = params.set('meeting_id', filters.meeting_id.toString());
    }
    if (filters?.member_id !== undefined) {
      params = params.set('member_id', filters.member_id.toString());
    }
    return this.http.get<Contribution[]>(this.apiUrl, { params });
  }

  getSummary(meeting_id?: number): Observable<ContributionSummary> {
    let params = new HttpParams();
    if (meeting_id !== undefined) {
      params = params.set('meeting_id', meeting_id.toString());
    }
    return this.http.get<ContributionSummary>(`${this.apiUrl}summary/`, { params });
  }

  getContribution(id: number): Observable<Contribution> {
    return this.http.get<Contribution>(`${this.apiUrl}${id}/`);
  }

  createContribution(data: ContributionCreate): Observable<Contribution> {
    return this.http.post<Contribution>(this.apiUrl, data);
  }

  updateContribution(id: number, data: ContributionUpdate): Observable<Contribution> {
    return this.http.patch<Contribution>(`${this.apiUrl}${id}/`, data);
  }

  deleteContribution(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}${id}/`);
  }
}
