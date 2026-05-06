import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, User } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private base = environment.apiUrl;

  currentUser = signal<User | null>(null);
  isAuthenticated = signal(false);

  constructor() { this.loadFromStorage(); }

  private loadFromStorage() {
    const token = localStorage.getItem('aeronix_token');
    const user = localStorage.getItem('aeronix_user');
    if (token && user) {
      this.currentUser.set(JSON.parse(user));
      this.isAuthenticated.set(true);
    }
  }

  register(data: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/auth/register`, data).pipe(
      tap(res => this.storeAuth(res))
    );
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/auth/login`, { email, password }).pipe(
      tap(res => this.storeAuth(res))
    );
  }

  googleLogin(googleToken: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/auth/google`, { token: googleToken }).pipe(
      tap(res => this.storeAuth(res)),
      catchError(() => {
        // Fallback: decode Google JWT and auto-register/login
        const payload = JSON.parse(atob(googleToken.split('.')[1]));
        return this.register({
          fullName: payload.name,
          email: payload.email,
          password: 'Google_' + Math.random().toString(36).substring(2),
          provider: 'GOOGLE'
        }).pipe(
          catchError(() => this.login(payload.email, 'Google_' + Math.random().toString(36).substring(2)))
        );
      })
    );
  }

  private storeAuth(res: AuthResponse) {
    localStorage.setItem('aeronix_token', res.accessToken);
    localStorage.setItem('aeronix_refresh', res.refreshToken);
    const user: User = {
      userId: res.userId, fullName: res.fullName, email: res.email,
      role: res.role as any, isActive: true
    };
    localStorage.setItem('aeronix_user', JSON.stringify(user));
    this.currentUser.set(user);
    this.isAuthenticated.set(true);
  }

  logout() {
    localStorage.removeItem('aeronix_token');
    localStorage.removeItem('aeronix_refresh');
    localStorage.removeItem('aeronix_user');
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/']);
  }

  getToken(): string | null { return localStorage.getItem('aeronix_token'); }

  getUserId(): number | null { return this.currentUser()?.userId ?? null; }
  getRole(): string { return this.currentUser()?.role ?? 'PASSENGER'; }
  isAdmin(): boolean { return this.getRole() === 'ADMIN'; }

  updateProfile(data: any): Observable<User> {
    const id = this.getUserId();
    return this.http.put<User>(`${this.base}/auth/profile`, data, {
      headers: { 'X-User-Id': String(id) }
    }).pipe(tap(u => {
      this.currentUser.set(u);
      localStorage.setItem('aeronix_user', JSON.stringify(u));
    }));
  }

  changePassword(oldPassword: string, newPassword: string): Observable<any> {
    return this.http.put(`${this.base}/auth/password`,
      { oldPassword, newPassword },
      { headers: { 'X-User-Id': String(this.getUserId()) } }
    );
  }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.base}/auth/users`, {
      headers: { Authorization: `Bearer ${this.getToken()}` }
    });
  }

  getUsersByRole(role: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.base}/auth/users/role/${role}`, {
      headers: { Authorization: `Bearer ${this.getToken()}` }
    });
  }

  reactivateUser(userId: number): Observable<any> {
    return this.http.put<any>(`${this.base}/auth/users/${userId}/reactivate`, {}, {
      headers: { Authorization: `Bearer ${this.getToken()}` }
    });
  }

  deactivateUser(userId: number): Observable<any> {
    return this.http.put<any>(`${this.base}/auth/users/${userId}/deactivate`, {}, {
      headers: { Authorization: `Bearer ${this.getToken()}` }
    });
  }
}
