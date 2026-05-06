import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Notification } from '../../shared/models';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private base = environment.apiUrl;
  unreadCount = signal(0);

  private headers() { return { 'X-User-Id': String(this.auth.getUserId()) }; }

  getMyNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.base}/notifications/my`, { headers: this.headers() });
  }

  getUnread(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.base}/notifications/my/unread`, { headers: this.headers() });
  }

  getUnreadCount(): Observable<{ unreadCount: number }> {
    return this.http.get<any>(`${this.base}/notifications/my/unread/count`, { headers: this.headers() }).pipe(
      tap(r => this.unreadCount.set(r.unreadCount))
    );
  }

  markAsRead(id: number): Observable<any> {
    return this.http.put(`${this.base}/notifications/${id}/read`, {}, { headers: this.headers() });
  }

  markAllRead(): Observable<any> {
    return this.http.put(`${this.base}/notifications/my/read-all`, {}, { headers: this.headers() }).pipe(
      tap(() => this.unreadCount.set(0))
    );
  }
}
