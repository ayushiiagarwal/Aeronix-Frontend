import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';
import { NotificationService } from './core/services/notification.service';
import { ToastService } from './core/services/toast.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <!-- Toast Container -->
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast toast-{{toast.type}}" (click)="toastService.remove(toast.id)">
          <span class="toast-icon">{{ toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ' }}</span>
          {{ toast.message }}
        </div>
      }
    </div>

    <!-- Navigation -->
    <nav class="navbar" [class.scrolled]="scrolled">
      <div class="nav-container">
        <a routerLink="/" class="nav-logo">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <path d="M16 3L7 21h5l4-7 4 7h5L16 3z" fill="var(--gold)"/>
            <path d="M4 26h24" stroke="var(--gold)" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <span class="logo-text">AERONIX</span>
        </a>

        <div class="nav-links">
          <a routerLink="/flights" class="nav-link">Search Flights</a>
          <a routerLink="/pnr" class="nav-link">PNR Lookup</a>
          @if (auth.isAuthenticated()) {
            <a routerLink="/dashboard" class="nav-link">{{ dashboardLabel }}</a>
            <a routerLink="/notifications" class="nav-link nav-notif">
              Alerts
              @if (notifService.unreadCount() > 0) {
                <span class="notif-badge">{{ notifService.unreadCount() }}</span>
              }
            </a>
            <div class="nav-user" (click)="toggleMenu()" #userMenu>
              <div class="avatar">{{ auth.currentUser()?.fullName?.charAt(0) }}</div>
              <span class="user-name">{{ (auth.currentUser()?.fullName ?? '').split(' ')[0] }}</span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 4l4 4 4-4" stroke="var(--white-dim)" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              @if (menuOpen) {
                <div class="dropdown">
                  <a routerLink="/profile" (click)="menuOpen=false">Profile</a>
                  <a routerLink="/dashboard" (click)="menuOpen=false">{{ dashboardLabel }}</a>
                  <div class="dropdown-divider"></div>
                  <button (click)="logout()">Sign Out</button>
                </div>
              }
            </div>
          } @else {
            <a routerLink="/auth/login" class="nav-link">Sign In</a>
            <a routerLink="/auth/register" class="btn btn-primary btn-sm">Join Now</a>
          }
        </div>

        <!-- Mobile menu button -->
        <button class="mobile-toggle" (click)="mobileOpen = !mobileOpen">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            @if (!mobileOpen) {
              <path d="M3 6h16M3 11h16M3 16h16" stroke="var(--white)" stroke-width="1.5" stroke-linecap="round"/>
            } @else {
              <path d="M5 5l12 12M17 5L5 17" stroke="var(--white)" stroke-width="1.5" stroke-linecap="round"/>
            }
          </svg>
        </button>
      </div>

      <!-- Mobile nav -->
      @if (mobileOpen) {
        <div class="mobile-nav">
          <a routerLink="/flights" (click)="mobileOpen=false">Search Flights</a>
          <a routerLink="/pnr" (click)="mobileOpen=false">PNR Lookup</a>
          @if (auth.isAuthenticated()) {
            <a routerLink="/dashboard" (click)="mobileOpen=false">{{ dashboardLabel }}</a>
            <a routerLink="/notifications" (click)="mobileOpen=false">Alerts</a>
            <a routerLink="/profile" (click)="mobileOpen=false">Profile</a>
            <button (click)="logout()">Sign Out</button>
          } @else {
            <a routerLink="/auth/login" (click)="mobileOpen=false">Sign In</a>
            <a routerLink="/auth/register" (click)="mobileOpen=false">Join Now</a>
          }
        </div>
      }
    </nav>

    <router-outlet />
  `,
  styles: [`
    .navbar {
      position: fixed; top: 0; left: 0; right: 0; z-index: 100;
      transition: all 0.3s ease;
      padding: 0 24px;
    }
    .navbar.scrolled {
      background: rgba(8,12,20,0.95);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--border-soft);
    }
    .nav-container {
      max-width: 1200px; margin: 0 auto;
      display: flex; align-items: center; justify-content: space-between;
      height: 72px;
    }
    .nav-logo {
      display: flex; align-items: center; gap: 10px;
      text-decoration: none;
    }
    .logo-text {
      font-family: var(--font-display);
      font-size: 1.4rem; font-weight: 500;
      letter-spacing: 0.15em;
      color: var(--white);
    }
    .nav-links {
      display: flex; align-items: center; gap: 8px;
    }
    .nav-link {
      padding: 8px 14px;
      color: var(--white-dim);
      font-size: 13px; font-weight: 400;
      letter-spacing: 0.04em;
      border-radius: var(--radius);
      transition: var(--transition);
      text-decoration: none;
      position: relative;
      &:hover { color: var(--white); background: var(--white-faint); }
    }
    .nav-notif { position: relative; }
    .notif-badge {
      position: absolute; top: 2px; right: 6px;
      background: var(--gold); color: var(--midnight);
      font-size: 9px; font-weight: 700;
      width: 16px; height: 16px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
    }
    .btn-sm { padding: 8px 18px; font-size: 12px; }
    .nav-user {
      display: flex; align-items: center; gap: 8px;
      padding: 6px 12px 6px 6px;
      border-radius: 100px;
      background: var(--white-faint);
      border: 1px solid var(--border-soft);
      cursor: pointer;
      position: relative;
      transition: var(--transition);
      &:hover { border-color: var(--border); }
    }
    .avatar {
      width: 30px; height: 30px; border-radius: 50%;
      background: var(--gold);
      color: var(--midnight);
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 600;
      font-family: var(--font-body);
    }
    .user-name { font-size: 13px; color: var(--white); }
    .dropdown {
      position: absolute; top: calc(100% + 10px); right: 0;
      background: var(--navy-light);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      min-width: 180px;
      overflow: hidden;
      box-shadow: var(--shadow);
      animation: slideUp 0.2s ease;
      a, button {
        display: block; width: 100%;
        padding: 11px 18px;
        font-size: 13px; color: var(--white-dim);
        text-decoration: none; background: none; border: none;
        cursor: pointer; text-align: left;
        transition: var(--transition);
        font-family: var(--font-body);
        &:hover { background: var(--white-faint); color: var(--white); }
      }
    }
    .dropdown-divider { height: 1px; background: var(--border-soft); margin: 4px 0; }
    .mobile-toggle { display: none; background: none; border: none; cursor: pointer; padding: 4px; }
    .mobile-nav {
      background: var(--navy);
      border-top: 1px solid var(--border-soft);
      padding: 16px 24px;
      display: flex; flex-direction: column; gap: 4px;
      a, button {
        display: block; padding: 10px 14px;
        color: var(--white-dim); text-decoration: none;
        font-size: 14px; border-radius: var(--radius);
        background: none; border: none; cursor: pointer;
        font-family: var(--font-body); text-align: left;
        &:hover { background: var(--white-faint); color: var(--white); }
      }
    }
    @media (max-width: 768px) {
      .nav-links { display: none; }
      .mobile-toggle { display: block; }
    }
  `]
})
export class AppComponent implements OnInit {
  auth = inject(AuthService);
  notifService = inject(NotificationService);
  toastService = inject(ToastService);
  menuOpen = false;
  mobileOpen = false;
  scrolled = false;

  get dashboardLabel(): string {
    return this.auth.isAdmin() || this.auth.getRole() === 'AIRLINE_STAFF' ? 'Dashboard' : 'My Trips';
  }

  ngOnInit() {
    window.addEventListener('scroll', () => { this.scrolled = window.scrollY > 20; });
    if (this.auth.isAuthenticated()) {
      this.notifService.getUnreadCount().subscribe();
    }
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.nav-user')) this.menuOpen = false;
    });
  }

  toggleMenu() { this.menuOpen = !this.menuOpen; }

  logout() {
    this.auth.logout();
    this.menuOpen = false;
    this.mobileOpen = false;
  }
}
