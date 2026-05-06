import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="page">
    <div class="container" style="padding-top:48px;padding-bottom:80px;max-width:760px">
      <h2 style="margin-bottom:8px">My Profile</h2>
      <p class="text-dim" style="margin-bottom:36px">Manage your personal information and account settings.</p>

      <div class="profile-layout">
        <!-- Avatar -->
        <div class="avatar-section card">
          <div class="profile-avatar">{{ user?.fullName?.charAt(0) }}</div>
          <div class="av-name">{{ user?.fullName }}</div>
          <div class="av-email">{{ user?.email }}</div>
          <span class="badge badge-gold" style="margin-top:8px">{{ user?.role }}</span>
        </div>

        <!-- Details -->
        <div class="profile-details">
          <div class="card" style="margin-bottom:20px">
            <h4 class="section-label">Personal Information</h4>
            <div class="pf-grid">
              <div class="form-group">
                <label>Full Name</label>
                <input type="text" [(ngModel)]="form.fullName" class="input">
              </div>
              <div class="form-group">
                <label>Phone</label>
                <input type="tel" [(ngModel)]="form.phone" class="input" placeholder="+91 ...">
              </div>
              <div class="form-group">
                <label>Passport Number</label>
                <input type="text" [(ngModel)]="form.passportNumber" class="input" placeholder="P1234567">
              </div>
              <div class="form-group">
                <label>Nationality</label>
                <input type="text" [(ngModel)]="form.nationality" class="input">
              </div>
            </div>
            <button class="btn btn-primary" style="margin-top:20px" (click)="saveProfile()" [disabled]="saving">
              @if (saving) { <span class="spinner" style="width:14px;height:14px"></span> }
              Save Changes
            </button>
          </div>

          <div class="card">
            <h4 class="section-label">Change Password</h4>
            <div class="pf-grid">
              <div class="form-group" style="grid-column:1/-1">
                <label>Current Password</label>
                <input type="password" [(ngModel)]="oldPassword" class="input" placeholder="••••••••">
              </div>
              <div class="form-group">
                <label>New Password</label>
                <input type="password" [(ngModel)]="newPassword" class="input" placeholder="Min. 8 chars">
              </div>
              <div class="form-group">
                <label>Confirm Password</label>
                <input type="password" [(ngModel)]="confirmPassword" class="input">
              </div>
            </div>
            <button class="btn btn-outline" style="margin-top:20px" (click)="changePassword()">Update Password</button>
          </div>
        </div>
      </div>
    </div>
  </div>
  `,
  styles: [`
    .profile-layout { display: flex; gap: 24px; align-items: flex-start; }
    .avatar-section { flex: 0 0 220px; text-align: center; padding: 32px 20px; }
    .profile-avatar {
      width: 80px; height: 80px; border-radius: 50%;
      background: var(--gold); color: var(--midnight);
      display: flex; align-items: center; justify-content: center;
      font-family: var(--font-display); font-size: 2.5rem;
      margin: 0 auto 16px;
    }
    .av-name { font-family: var(--font-display); font-size: 1.2rem; }
    .av-email { font-size: 12px; color: var(--white-dim); margin-top: 4px; word-break: break-all; }
    .profile-details { flex: 1; min-width: 0; }
    .section-label { font-family: var(--font-display); font-size: 1.1rem; margin-bottom: 20px; color: var(--gold); }
    .pf-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 6px;
      label { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--gold-dim); } }

    @media (max-width: 700px) {
      .profile-layout { flex-direction: column; }
      .avatar-section { flex: none; width: 100%; }
      .pf-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class ProfileComponent implements OnInit {
  auth = inject(AuthService);
  toast = inject(ToastService);

  get user() { return this.auth.currentUser(); }
  saving = false;
  oldPassword = ''; newPassword = ''; confirmPassword = '';
  form = { fullName: '', phone: '', passportNumber: '', nationality: '' };

  ngOnInit() {
    const u = this.user;
    if (u) this.form = { fullName: u.fullName, phone: u.phone || '', passportNumber: u.passportNumber || '', nationality: u.nationality || '' };
  }

  saveProfile() {
    this.saving = true;
    this.auth.updateProfile(this.form).subscribe({
      next: () => { this.toast.success('Profile updated!'); this.saving = false; },
      error: () => { this.toast.error('Update failed'); this.saving = false; }
    });
  }

  changePassword() {
    if (!this.oldPassword || !this.newPassword) { this.toast.error('Fill all password fields'); return; }
    if (this.newPassword !== this.confirmPassword) { this.toast.error('Passwords do not match'); return; }
    if (this.newPassword.length < 8) { this.toast.error('Password must be at least 8 characters'); return; }
    this.auth.changePassword(this.oldPassword, this.newPassword).subscribe({
      next: () => { this.toast.success('Password changed!'); this.oldPassword = ''; this.newPassword = ''; this.confirmPassword = ''; },
      error: () => this.toast.error('Password change failed')
    });
  }
}
