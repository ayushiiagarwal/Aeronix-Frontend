import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../core/services/notification.service';
import { ToastService } from '../../core/services/toast.service';
import { Notification } from '../../shared/models';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="page">
    <div class="container" style="padding-top:48px;padding-bottom:80px;max-width:800px">
      <div class="notif-header">
        <div>
          <h2>Notifications</h2>
          <p class="text-dim" style="margin-top:6px">{{ unread }} unread notification{{ unread !== 1 ? 's' : '' }}</p>
        </div>
        @if (unread > 0) {
          <button class="btn btn-ghost" (click)="markAllRead()">Mark all as read</button>
        }
      </div>

      @if (loading) {
        <div style="display:flex;align-items:center;gap:16px;padding:40px 0">
          <div class="spinner"></div><span class="text-dim">Loading notifications...</span>
        </div>
      } @else if (notifications.length === 0) {
        <div class="empty-notif">
          <div style="font-size:3rem;margin-bottom:16px">🔔</div>
          <h3>No notifications</h3>
          <p>You're all caught up!</p>
        </div>
      } @else {
        <div class="notif-list stagger">
          @for (n of notifications; track n.notificationId) {
            <div class="notif-item" [class.unread]="!n.isRead" (click)="markRead(n)">
              <div class="notif-icon {{ getTypeClass(n.type) }}">
                {{ getTypeIcon(n.type) }}
              </div>
              <div class="notif-content">
                <div class="notif-title">{{ n.title }}</div>
                <div class="notif-msg">{{ n.message }}</div>
                <div class="notif-time">{{ formatTime(n.sentAt) }}</div>
              </div>
              @if (!n.isRead) {
                <div class="unread-dot"></div>
              }
            </div>
          }
        </div>
      }
    </div>
  </div>
  `,
  styles: [`
    .notif-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 32px; flex-wrap: wrap;
      h2 { font-size: 2.2rem; } }
    .notif-list { display: flex; flex-direction: column; gap: 10px; }
    .notif-item {
      display: flex; align-items: flex-start; gap: 16px; padding: 18px 20px;
      background: var(--navy-light); border: 1px solid var(--border-soft);
      border-radius: var(--radius-lg); cursor: pointer; transition: var(--transition);
      position: relative;
      &:hover { border-color: var(--border); }
      &.unread { border-color: rgba(201,168,76,0.25); background: var(--navy-mid); }
    }
    .notif-icon {
      width: 40px; height: 40px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.2rem; flex-shrink: 0;
      background: var(--white-faint);
      &.type-booking { background: rgba(201,168,76,0.12); }
      &.type-payment { background: rgba(76,175,120,0.12); }
      &.type-alert { background: rgba(224,92,92,0.12); }
      &.type-info { background: rgba(100,149,237,0.12); }
    }
    .notif-content { flex: 1; min-width: 0; }
    .notif-title { font-size: 14px; color: var(--white); margin-bottom: 4px; font-weight: 400; }
    .notif-msg { font-size: 13px; color: var(--white-dim); line-height: 1.5; }
    .notif-time { font-size: 11px; color: rgba(245,240,232,0.35); margin-top: 6px; }
    .unread-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: var(--gold); flex-shrink: 0; margin-top: 6px;
    }
    .empty-notif { text-align: center; padding: 80px 0;
      h3 { font-size: 1.6rem; margin-bottom: 8px; }
      p { color: var(--white-dim); font-size: 14px; }
    }
  `]
})
export class NotificationsComponent implements OnInit {
  notifSvc = inject(NotificationService);
  toast = inject(ToastService);
  notifications: Notification[] = [];
  loading = false;
  get unread() { return this.notifications.filter(n => !n.isRead).length; }

  ngOnInit() {
    this.loading = true;
    this.notifSvc.getMyNotifications().subscribe({
      next: n => { this.notifications = n; this.loading = false; },
      error: () => this.loading = false
    });
  }

  markRead(n: Notification) {
    if (n.isRead) return;
    this.notifSvc.markAsRead(n.notificationId).subscribe(() => {
      n.isRead = true;
      this.notifSvc.unreadCount.update(c => Math.max(0, c - 1));
    });
  }

  markAllRead() {
    this.notifSvc.markAllRead().subscribe(() => {
      this.notifications.forEach(n => n.isRead = true);
      this.toast.success('All marked as read');
    });
  }

  getTypeClass(type: string): string {
    if (type?.includes('BOOKING') || type?.includes('CONFIRM')) return 'type-booking';
    if (type?.includes('PAYMENT') || type?.includes('REFUND')) return 'type-payment';
    if (type?.includes('CANCEL') || type?.includes('ALERT')) return 'type-alert';
    return 'type-info';
  }

  getTypeIcon(type: string): string {
    if (type?.includes('BOOKING') || type?.includes('CONFIRM')) return '🎫';
    if (type?.includes('PAYMENT') || type?.includes('REFUND')) return '💳';
    if (type?.includes('CANCEL')) return '❌';
    if (type?.includes('CHECKIN')) return '✅';
    return '📢';
  }

  formatTime(ts: string): string {
    if (!ts) return '';
    const d = new Date(ts), now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString();
  }
}
