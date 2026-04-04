import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private tokenSignal = signal<string | null>(this.getStoredToken());

  token = this.tokenSignal.asReadonly();

  constructor(private http: HttpClient, private router: Router) {}

  isAuthenticated(): boolean {
    return !!this.getStoredToken();
  }

  private getStoredToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private setToken(token: string): void {
    localStorage.setItem('access_token', token);
    this.tokenSignal.set(token);
  }

  private clearToken(): void {
    localStorage.removeItem('access_token');
    this.tokenSignal.set(null);
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login/`, credentials).pipe(
      tap(response => {
        this.setToken(response.access_token);
      }),
      catchError(error => {
        this.clearToken();
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    this.clearToken();
    this.router.navigate(['/login']);
  }
}
