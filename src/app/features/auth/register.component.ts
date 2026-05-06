import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { environment } from '../../../environments/environment';

declare const google: any;

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
  <div class="auth-page">
    <div class="auth-left">
      <div class="auth-brand">
        <span class="logo-text">AERONIX</span>
        <div class="gold-line"></div>
        <h2>Start Your Journey</h2>
        <p>Book with Aeronix for a seamless flying experience.</p>
      </div>
      <div class="auth-deco">
        <div class="deco-circle c1"></div>
        <div class="deco-circle c2"></div>
      </div>
    </div>

    <div class="auth-right fade-in">
      <div class="auth-form-wrap">
        <h3>Create Account</h3>
        <p class="auth-sub">Already a member? <a routerLink="/auth/login">Sign in</a></p>

        <div id="google-signup-btn"></div>
        <div class="or-divider"><span>or register with email</span></div>

        <form (ngSubmit)="register()">
          <div class="form-row">
            <div class="form-group">
              <label>Full Name *</label>
              <input type="text" [(ngModel)]="form.fullName" name="fullName"
                class="input" placeholder="Rahul Sharma" required>
            </div>
            <div class="form-group">
              <label>Phone *</label>
              <input type="tel" [(ngModel)]="form.phone" name="phone"
                class="input" placeholder="+91 98765 43210">
            </div>
          </div>

          <div class="form-group">
            <label>Email Address *</label>
            <input type="email" [(ngModel)]="form.email" name="email"
              class="input" placeholder="you@example.com" required>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Password *</label>
              <input [type]="showPass ? 'text' : 'password'" [(ngModel)]="form.password" name="password"
                class="input" placeholder="Min. 8 characters" required minlength="8">
            </div>
            <div class="form-group">
              <label>Passport No. <span style="color:var(--white-dim);font-size:10px">(optional)</span></label>
              <input type="text" [(ngModel)]="form.passportNumber" name="passportNumber"
                class="input" placeholder="P1234567">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Nationality *</label>
              <input type="text" [(ngModel)]="form.nationality" name="nationality"
                class="input" placeholder="Indian">
            </div>
            <div class="form-group">
              <label>Account Type *</label>
              <select [(ngModel)]="form.role" name="role" class="input">
                <option value="PASSENGER">Passenger</option>
                <option value="AIRLINE_STAFF">Airline Staff</option>
              </select>
            </div>
          </div>

          <label class="show-pass-label">
            <input type="checkbox" [(ngModel)]="showPass" name="showPass"> Show password
          </label>

          @if (error) {
            <div class="auth-error">{{ error }}</div>
          }

          <button type="submit" class="btn btn-primary w-full" style="margin-top:20px; justify-content:center"
            [disabled]="loading">
            @if (loading) { <span class="spinner" style="width:16px;height:16px"></span> }
            Create Account
          </button>
        </form>

        <p class="terms">By signing up you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.</p>
      </div>
    </div>
  </div>
  `,
  styles: [`
    .auth-page { min-height: 100vh; display: flex; }
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
      h2 { font-size: 2.2rem; margin-bottom: 14px; }
      p { color: var(--white-dim); line-height: 1.7; font-size: 15px; margin-bottom: 28px; }
    }
    
    .auth-deco { position: absolute; inset: 0; pointer-events: none; }
    .deco-circle { position: absolute; border-radius: 50%; border: 1px solid var(--border); }
    .c1 { width: 280px; height: 280px; bottom: -60px; right: -60px; }
    .c2 { width: 160px; height: 160px; bottom: 10px; right: -20px; background: var(--gold-glow); }

    .auth-right {
      flex: 1; display: flex; align-items: center; justify-content: center;
      padding: 80px 40px; background: var(--midnight); overflow-y: auto;
    }
    .auth-form-wrap {
      width: 100%; max-width: 440px;
      h3 { font-size: 1.8rem; margin-bottom: 6px; }
    }
    .auth-sub { color: var(--white-dim); font-size: 14px; margin-bottom: 24px; a { color: var(--gold); } }
    #google-signup-btn { margin-bottom: 16px; min-height: 44px; }
    .or-divider {
      display: flex; align-items: center; gap: 12px; margin: 16px 0;
      color: var(--white-dim); font-size: 12px; letter-spacing: 0.08em;
      &::before, &::after { content: ''; flex: 1; height: 1px; background: var(--border-soft); }
    }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
    .form-group { display: flex; flex-direction: column; gap: 6px;
      label { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--gold-dim); } }
    .show-pass-label {
      display: flex; align-items: center; gap: 8px;
      margin-top: 14px; font-size: 13px; color: var(--white-dim); cursor: pointer;
    }
    .auth-error {
      margin-top: 12px; padding: 10px 14px;
      background: rgba(224,92,92,0.12); border: 1px solid rgba(224,92,92,0.3);
      border-radius: var(--radius); color: var(--error); font-size: 13px;
    }
    .terms { margin-top: 14px; font-size: 12px; color: var(--white-dim); text-align: center;
      a { color: var(--gold); } }

    @media (max-width: 768px) {
      .auth-page { flex-direction: column; }
      .auth-left { flex: 0 0 auto; padding: 40px 24px 50px; }
      .auth-right { padding: 40px 24px; }
      .form-row { grid-template-columns: 1fr; }
    }
  `]
})
export class RegisterComponent implements OnInit {
  auth = inject(AuthService);
  toast = inject(ToastService);
  router = inject(Router);

  form = { fullName: '', email: '', password: '', phone: '', passportNumber: '', nationality: 'Indian', role: 'PASSENGER' };
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
      document.getElementById('google-signup-btn'),
      { theme: 'filled_black', size: 'large', width: 440, text: 'signup_with', shape: 'rectangular' }
    );
  }

  handleGoogle(res: any) {
    this.loading = true;
    this.auth.googleLogin(res.credential).subscribe({
      next: () => { this.toast.success('Account created!'); this.router.navigate(['/dashboard']); },
      error: () => { this.toast.error('Google sign-up failed'); this.loading = false; }
    });
  }

  register() {
    if (!this.form.fullName || !this.form.email || !this.form.password) return;
    this.loading = true; this.error = '';
    this.auth.register(this.form).subscribe({
      next: () => { this.toast.success('Welcome to Aeronix!'); this.router.navigate(['/dashboard']); },
      error: (e) => { this.error = e?.error?.message || 'Registration failed'; this.loading = false; }
    });
  }
}
