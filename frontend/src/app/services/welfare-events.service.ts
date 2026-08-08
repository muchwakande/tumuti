import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  WelfareEvent, WelfareEventCreate, WelfareEventUpdate, WelfareEventDetail,
  Payout, PayoutCreate, PayoutUpdate,
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class WelfareEventsService {
  private readonly apiUrl = `${environment.apiUrl}/welfare-events/`;

  constructor(private http: HttpClient) {}

  getEvents(filters?: { member_id?: number; event_type?: string }): Observable<WelfareEvent[]> {
    let params = new HttpParams();
    if (filters?.member_id !== undefined) {
      params = params.set('member_id', filters.member_id.toString());
    }
    if (filters?.event_type) {
      params = params.set('event_type', filters.event_type);
    }
    return this.http.get<WelfareEvent[]>(this.apiUrl, { params });
  }

  getEvent(id: number): Observable<WelfareEvent> {
    return this.http.get<WelfareEvent>(`${this.apiUrl}${id}/`);
  }

  getDetail(id: number): Observable<WelfareEventDetail> {
    return this.http.get<WelfareEventDetail>(`${this.apiUrl}${id}/detail/`);
  }

  createEvent(data: WelfareEventCreate): Observable<WelfareEvent> {
    return this.http.post<WelfareEvent>(this.apiUrl, data);
  }

  updateEvent(id: number, data: WelfareEventUpdate): Observable<WelfareEvent> {
    return this.http.patch<WelfareEvent>(`${this.apiUrl}${id}/`, data);
  }

  deleteEvent(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}${id}/`);
  }

  createPayout(eventId: number, data: PayoutCreate): Observable<Payout> {
    return this.http.post<Payout>(`${this.apiUrl}${eventId}/payout/`, data);
  }

  updatePayout(eventId: number, data: PayoutUpdate): Observable<Payout> {
    return this.http.patch<Payout>(`${this.apiUrl}${eventId}/payout/`, data);
  }

  deletePayout(eventId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}${eventId}/payout/`);
  }
}
