import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Payment, PaymentCreate, PaymentSummary } from '../models';

@Injectable({
  providedIn: 'root'
})
export class PaymentsService {
  private readonly apiUrl = `${environment.apiUrl}/payments/`;

  constructor(private http: HttpClient) {}

  getPayments(filters?: { meeting_id?: number; member_id?: number }): Observable<Payment[]> {
    let params = new HttpParams();
    if (filters?.meeting_id !== undefined) {
      params = params.set('meeting_id', filters.meeting_id.toString());
    }
    if (filters?.member_id !== undefined) {
      params = params.set('member_id', filters.member_id.toString());
    }
    return this.http.get<Payment[]>(this.apiUrl, { params });
  }

  getSummary(meeting_id?: number): Observable<PaymentSummary> {
    let params = new HttpParams();
    if (meeting_id !== undefined) {
      params = params.set('meeting_id', meeting_id.toString());
    }
    return this.http.get<PaymentSummary>(`${this.apiUrl}summary/`, { params });
  }

  createPayment(data: PaymentCreate): Observable<Payment> {
    return this.http.post<Payment>(this.apiUrl, data);
  }

  deletePayment(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}${id}/`);
  }
}
