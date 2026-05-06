import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { environment } from '../../../environments/environment';

declare const google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
  <div class="auth-page">
    <div class="auth-left">
      <div class="auth-brand">
        <span class="logo-text">AERONIX</span>
        <div class="gold-line"></div>
        <h2>Welcome Back</h2>
        <p>Sign in to access your bookings, manage trips, and get exclusive deals.</p>
      </div>
      <div class="auth-deco">
        <div class="deco-circle c1"></div>
        <div class="deco-circle c2"></div>
        <div class="deco-circle c3"></div>
        <svg class="plane-svg" viewBox="0 0 200 200" fill="none">
          <path d="M20 100L180 20 160 100 180 180 20 100z" stroke="var(--gold)" stroke-width="1.5" fill="none" stroke-dasharray="4 3"/>
        </svg>
      </div>
    </div>

    <div class="auth-right fade-in">
      <div class="auth-form-wrap">
        <h3>Sign In</h3>
        <p class="auth-sub">New to Aeronix? <a routerLink="/auth/register">Create account</a></p>

        <div class="form-group" style="margin-bottom:16px">
          <label>Log in as</label>
          <select name="role" [(ngModel)]="selectedRole" class="input">
            <option value="PASSENGER">Passenger</option>
            <option value="ADMIN">Admin</option>
            <option value="AIRLINE_STAFF">Airline Staff</option>
          </select>
        </div>

        <!-- Google Sign-In -->
        <div id="google-signin-btn"></div>
        
        <div class="or-divider"><span>or continue with email</span></div>

        <form (ngSubmit)="login()" #f="ngForm">
          <div class="form-group">
            <label>Email Address</label>
            <input type="email" name="email" [(ngModel)]="email" class="input"
              placeholder="you@gmail.com" required>
          </div>
          <div class="form-group" style="margin-top:16px">
            <label>Password</label>
            <div class="password-wrap">
              <input [type]="showPass ? 'text' : 'password'" name="password"
                [(ngModel)]="password" class="input" placeholder="••••••••" required>
              <button type="button" class="show-pass" (click)="showPass = !showPass">
                {{ showPass ? 'Hide' : 'Show' }}
              </button>
            </div>
          </div>

          @if (error) {
            <div class="auth-error">{{ error }}</div>
          }

          <button type="submit" class="btn btn-primary w-full" style="margin-top:24px; justify-content:center"
            [disabled]="loading">
            @if (loading) { <span class="spinner" style="width:16px;height:16px"></span> }
            Sign In
          </button>
        </form>

        <p class="guest-link">
          Just browsing? <a routerLink="/flights">Search flights as guest</a>
        </p>
      </div>
    </div>
  </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh; display: flex;
    }
    .auth-left {
      flex: 0 0 42%; background: var(--navy);
      border-right: 1px solid var(--border-soft);
      display: flex; flex-direction: column; justify-content: center;
      padding: 60px 48px; position: relative; overflow: hidden;
    }
    .auth-brand {
      position: relative; z-index: 1;
      .logo-text { font-family: var(--font-display); font-size: 1.8rem; letter-spacing: 0.2em; color: var(--gold); }
      .gold-line { margin: 20px 0; }
      h2 { font-size: 2.5rem; margin-bottom: 16px; }
      p { color: var(--white-dim); line-height: 1.7; font-size: 15px; }
    }
    .auth-deco { position: absolute; inset: 0; pointer-events: none; }
    .deco-circle {
      position: absolute; border-radius: 50%; border: 1px solid var(--border);
    }
    .c1 { width: 300px; height: 300px; bottom: -80px; right: -80px; }
    .c2 { width: 200px; height: 200px; bottom: 20px; right: -30px; background: var(--gold-glow); }
    .c3 { width: 120px; height: 120px; top: 40px; right: 60px; border-color: var(--border); }
    .plane-svg { position: absolute; bottom: 60px; right: 30px; width: 120px; opacity: 0.4; }

    .auth-right {
      flex: 1; display: flex; align-items: center; justify-content: center;
      padding: 60px 40px; background: var(--midnight);
    }
    .auth-form-wrap {
      width: 100%; max-width: 400px;
      h3 { font-size: 1.8rem; margin-bottom: 6px; }
    }
    .auth-sub { color: var(--white-dim); font-size: 14px; margin-bottom: 28px; a { color: var(--gold); } }
    
    #google-signin-btn { margin-bottom: 16px; min-height: 44px; }
    
    .or-divider {
      display: flex; align-items: center; gap: 12px; margin: 20px 0;
      color: var(--white-dim); font-size: 12px; letter-spacing: 0.08em;
      &::before, &::after { content: ''; flex: 1; height: 1px; background: var(--border-soft); }
    }
    .form-group { display: flex; flex-direction: column; gap: 6px;
      label { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--gold-dim); } }
    .password-wrap { position: relative; }
    .show-pass {
      position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
      background: none; border: none; color: var(--white-dim); font-size: 12px;
      cursor: pointer; font-family: var(--font-body);
      &:hover { color: var(--gold); }
    }
    .auth-error {
      margin-top: 12px; padding: 10px 14px;
      background: rgba(224,92,92,0.12); border: 1px solid rgba(224,92,92,0.3);
      border-radius: var(--radius); color: var(--error); font-size: 13px;
    }
    .guest-link {
      margin-top: 20px; text-align: center; font-size: 13px; color: var(--white-dim);
      a { color: var(--gold); }
    }

    @media (max-width: 768px) {
      .auth-page { flex-direction: column; }
      .auth-left { flex: 0 0 auto; padding: 40px 24px 60px; }
      .auth-right { padding: 40px 24px; }
    }
  `]
})
export class LoginComponent implements OnInit {
  auth = inject(AuthService);
  toast = inject(ToastService);
  router = inject(Router);

  email = ''; password = '';
  selectedRole: 'PASSENGER' | 'ADMIN' | 'AIRLINE_STAFF' = 'PASSENGER';
  loading = false; showPass = false; error = '';

  ngOnInit() {
    if (this.auth.isAuthenticated()) { this.router.navigate(['/dashboard']); return; }
    setTimeout(() => this.initGoogle(), 500);
  }

  initGoogle() {
    if (typeof google === 'undefined') return;
    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (res: any) => this.handleGoogle(res)
    });
    google.accounts.id.renderButton(
      document.getElementById('google-signin-btn'),
      { theme: 'filled_black', size: 'large', width: 400, text: 'signin_with', shape: 'rectangular' }
    );
  }

  handleGoogle(res: any) {
    this.loading = true;
    this.auth.googleLogin(res.credential).subscribe({
      next: () => { this.toast.success('Welcome back!'); this.router.navigate(['/dashboard']); },
      error: () => { this.toast.error('Google sign-in failed'); this.loading = false; }
    });
  }

  login() {
    if (!this.email || !this.password) return;
    this.loading = true; this.error = '';
    this.auth.login(this.email, this.password).subscribe({
      next: (res) => {
        const loggedInRole = (res.role || '').toUpperCase();
        if (loggedInRole !== this.selectedRole) {
          this.auth.logout();
          this.error = `This account is ${loggedInRole || 'unknown'}, not ${this.selectedRole}. Please choose the correct login type.`;
          this.loading = false;
          return;
        }
        this.toast.success('Welcome back!');
        this.router.navigate(['/dashboard']);
      },
      error: (e) => {
        this.error = e?.error?.message || 'Invalid credentials';
        this.loading = false;
      }
    });
  }
}
