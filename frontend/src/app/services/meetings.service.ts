import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Meeting, MeetingCreate, MeetingUpdate, MeetingDetail } from '../models';

@Injectable({
  providedIn: 'root'
})
export class MeetingsService {
  private readonly apiUrl = `${environment.apiUrl}/meetings/`;

  constructor(private http: HttpClient) {}

  getMeetings(filters?: { year?: number; month?: number; status?: string }): Observable<Meeting[]> {
    let params = new HttpParams();
    if (filters?.year !== undefined) {
      params = params.set('year', filters.year.toString());
    }
    if (filters?.month !== undefined) {
      params = params.set('month', filters.month.toString());
    }
    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    return this.http.get<Meeting[]>(this.apiUrl, { params });
  }

  getUpcoming(): Observable<Meeting[]> {
    return this.http.get<Meeting[]>(`${this.apiUrl}upcoming/`);
  }

  getMeeting(id: number): Observable<Meeting> {
    return this.http.get<Meeting>(`${this.apiUrl}${id}/`);
  }

  createMeeting(data: MeetingCreate): Observable<Meeting> {
    return this.http.post<Meeting>(this.apiUrl, data);
  }

  updateMeeting(id: number, data: MeetingUpdate): Observable<Meeting> {
    return this.http.patch<Meeting>(`${this.apiUrl}${id}/`, data);
  }

  deleteMeeting(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}${id}/`);
  }

  getDetail(id: number): Observable<MeetingDetail> {
    return this.http.get<MeetingDetail>(`${this.apiUrl}${id}/detail/`);
  }

  toggleAttendance(meetingId: number, memberId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}${meetingId}/attendance/${memberId}/`, {});
  }
}
