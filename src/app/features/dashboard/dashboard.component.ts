import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { BookingService } from '../../core/services/booking.service';
import { FlightService } from '../../core/services/flight.service';
import { ToastService } from '../../core/services/toast.service';
import { Booking, Flight } from '../../shared/models';
import { OperationsCenterComponent } from './operations-center.component';

type OpsStat = {
  value: string | number;
  label: string;
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, OperationsCenterComponent],
  template: `
  <div class="page">
    <div class="container" style="padding-top:48px;padding-bottom:80px">
      @if (isOperationsUser) {
        <app-operations-center [isAdmin]="isAdmin"></app-operations-center>
      } @else {
        <!-- Passenger dashboard -->
        <div class="dash-header">
          <div>
            <div class="eyebrow text-gold">Welcome back</div>
            <h2>{{ auth.currentUser()?.fullName }}</h2>
            <p class="text-dim" style="margin-top:6px">Manage your bookings, check-ins, and travel history.</p>
          </div>
          <a routerLink="/flights" class="btn btn-primary">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 8h12M8 2l6 6-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            New Booking
          </a>
        </div>

        <div class="dash-stats stagger">
          <div class="stat-card card">
            <div class="sc-value">{{ bookings.length }}</div>
            <div class="sc-label">Total Trips</div>
          </div>
          <div class="stat-card card">
            <div class="sc-value text-gold">{{ upcoming.length }}</div>
            <div class="sc-label">Upcoming</div>
          </div>
          <div class="stat-card card">
            <div class="sc-value">{{ confirmed }}</div>
            <div class="sc-label">Confirmed</div>
          </div>
          <div class="stat-card card">
            <div class="sc-value">Rs {{ totalSpend | number }}</div>
            <div class="sc-label">Total Spent</div>
          </div>
        </div>

        <div class="booking-tabs">
          @for (tab of tabs; track tab.value) {
            <button class="tab-btn" [class.active]="activeTab === tab.value" (click)="activeTab = tab.value">
              {{ tab.label }}
            </button>
          }
        </div>

        @if (loading) {
          <div style="display:flex;align-items:center;gap:16px;padding:40px 0">
            <div class="spinner"></div><span class="text-dim">Loading trips...</span>
          </div>
        } @else if (filteredBookings.length === 0) {
          <div class="empty-state">
            <div style="font-size:3rem;margin-bottom:16px">No trips yet</div>
            <h3>No {{ activeTab === 'ALL' ? '' : activeTab.toLowerCase() }} bookings</h3>
            <p>Ready for your next adventure?</p>
            <a routerLink="/flights" class="btn btn-primary" style="margin-top:20px">Search Flights</a>
          </div>
        } @else {
          <div class="bookings-list stagger">
            @for (b of filteredBookings; track b.bookingId) {
              <div class="booking-card card">
                <div class="bc-main">
                  <div class="bc-pnr">
                    <div class="pnr-label">PNR</div>
                    <div class="pnr-val">{{ b.pnrCode }}</div>
                  </div>
                  <div class="bc-route">
                    <div class="bc-route-info">Flight #{{ b.flightId }} | {{ b.seatClass }}</div>
                    <div class="bc-date">Booked {{ b.bookedAt | slice:0:10 }}</div>
                    @if (b.confirmedAt) {
                      <div class="bc-date">Confirmed {{ b.confirmedAt | slice:0:10 }}</div>
                    }
                  </div>
                  <div class="bc-badges">
                    <span class="badge badge-{{ getStatusBadge(b.status) }}">{{ b.status }}</span>
                    <span class="badge badge-neutral">{{ b.passengerCount }} pax</span>
                    @if (b.checkedIn) { <span class="badge badge-success">Checked In</span> }
                  </div>
                </div>
                <div class="bc-right">
                  <div class="bc-fare">Rs {{ b.totalFare | number }}</div>
                  <div class="bc-actions">
                    @if (b.status === 'CONFIRMED' && !b.checkedIn) {
                      <button class="btn btn-outline" style="padding:8px 14px;font-size:12px"
                        (click)="checkIn(b.bookingId)">Check In</button>
                    }
                    @if (b.status === 'PENDING' || b.status === 'CONFIRMED') {
                      <button class="btn btn-ghost" style="padding:8px 14px;font-size:12px;color:var(--error);border-color:rgba(224,92,92,0.3)"
                        (click)="confirmCancel(b)">Cancel</button>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        }

        @if (cancelTarget) {
          <div class="modal-backdrop" (click)="cancelTarget = null">
            <div class="modal" (click)="$event.stopPropagation()">
              <div class="modal-header">
                <h3 style="font-size:1.4rem">Cancel Booking</h3>
                <button class="close-btn" (click)="cancelTarget = null">x</button>
              </div>
              <div class="modal-body">
                <p style="color:var(--white-dim);margin-bottom:20px">
                  Are you sure you want to cancel booking <strong class="text-gold">{{ cancelTarget.pnrCode }}</strong>?
                  Refund will be processed as per airline policy.
                </p>
                <div class="form-group">
                  <label>Reason</label>
                  <input type="text" [(ngModel)]="cancelReason" class="input"
                    placeholder="Change of plans..." [ngModelOptions]="{standalone: true}">
                </div>
                <div style="display:flex;gap:12px;margin-top:20px;justify-content:flex-end">
                  <button class="btn btn-ghost" (click)="cancelTarget=null">Keep Booking</button>
                  <button class="btn" style="background:var(--error);color:white"
                    (click)="cancelBooking()" [disabled]="cancelling">
                    @if (cancelling) { <span class="spinner" style="width:14px;height:14px"></span> }
                    Yes, Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        }
      }
    </div>
  </div>
  `,
  styles: [`
    .dash-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: 20px; margin-bottom: 36px; flex-wrap: wrap;
      h2 { font-size: 2.2rem; }
    }
    .dash-actions {
      display: flex; gap: 10px; flex-wrap: wrap; align-items: center;
    }
    .eyebrow {
      font-size: 11px; text-transform: uppercase; letter-spacing: 0.14em;
      margin-bottom: 6px;
    }
    .dash-stats {
      display: grid; grid-template-columns: repeat(4, 1fr);
      gap: 16px; margin-bottom: 36px;
    }
    .stat-card { padding: 24px; text-align: center; }
    .sc-value { font-family: var(--font-display); font-size: 2rem; line-height: 1; }
    .sc-label {
      font-size: 12px; color: var(--white-dim); margin-top: 6px;
      text-transform: uppercase; letter-spacing: 0.08em;
    }

    .section-head {
      display: flex; justify-content: space-between; align-items: end;
      gap: 16px; margin: 18px 0 18px;
    }
    .section-head h3 {
      font-family: var(--font-display);
      font-size: 1.35rem;
      color: var(--white);
      margin: 0;
    }
    .section-meta {
      font-size: 12px;
      color: var(--white-dim);
      letter-spacing: 0.06em;
    }

    .ops-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
    }
    .ops-card {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .ops-top {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: flex-start;
    }
    .ops-code {
      font-family: var(--font-display);
      color: var(--gold);
      font-size: 1.1rem;
      letter-spacing: 0.08em;
    }
    .ops-name {
      font-size: 12px;
      color: var(--white-dim);
      margin-top: 2px;
    }
    .ops-route {
      display: flex;
      align-items: center;
      gap: 14px;
      justify-content: space-between;
    }
    .ops-time {
      min-width: 62px;
    }
    .ops-time.right {
      text-align: right;
    }
    .ops-clock {
      font-family: var(--font-display);
      font-size: 1.5rem;
      color: var(--white);
      line-height: 1;
    }
    .ops-airport {
      font-size: 11px;
      color: var(--white-dim);
      letter-spacing: 0.08em;
      margin-top: 4px;
    }
    .ops-path {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 10px;
      color: var(--white-dim);
      min-width: 120px;
    }
    .ops-path-line {
      flex: 1;
      height: 1px;
      background: var(--border);
    }
    .ops-path-label {
      font-size: 11px;
      white-space: nowrap;
    }
    .ops-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .ops-bottom {
      display: flex;
      align-items: end;
      justify-content: space-between;
      gap: 12px;
    }
    .ops-price {
      font-family: var(--font-display);
      color: var(--gold);
      font-size: 1.5rem;
      line-height: 1;
    }
    .ops-price-sub {
      font-size: 11px;
      color: var(--white-dim);
      margin-top: 4px;
    }

    .info-panel {
      padding: 18px 20px;
      color: var(--white-dim);
      line-height: 1.6;
    }

    .booking-tabs {
      display: flex; gap: 4px; margin-bottom: 24px;
      background: var(--navy); border-radius: var(--radius); padding: 4px; width: fit-content;
    }
    .tab-btn {
      padding: 8px 20px; border: none; border-radius: calc(var(--radius) - 2px);
      background: transparent; cursor: pointer; font-family: var(--font-body);
      font-size: 13px; color: var(--white-dim); transition: var(--transition);
      &.active { background: var(--gold); color: var(--midnight); font-weight: 500; }
    }

    .bookings-list { display: flex; flex-direction: column; gap: 14px; }
    .booking-card { padding: 0; overflow: hidden; display: flex; }
    .bc-main {
      flex: 1; padding: 22px 24px;
      display: flex; gap: 24px; align-items: center; flex-wrap: wrap;
    }
    .bc-pnr { flex: 0 0 auto; }
    .pnr-label {
      font-size: 9px; text-transform: uppercase; letter-spacing: 0.12em; color: var(--gold-dim);
    }
    .pnr-val { font-family: var(--font-display); font-size: 1.4rem; color: var(--gold); letter-spacing: 0.1em; }
    .bc-route { flex: 1; min-width: 140px; }
    .bc-route-info { font-size: 14px; color: var(--white); margin-bottom: 4px; }
    .bc-date { font-size: 12px; color: var(--white-dim); }
    .bc-badges { display: flex; flex-wrap: wrap; gap: 6px; }
    .bc-right {
      flex: 0 0 auto; padding: 22px 20px;
      background: var(--midnight); border-left: 1px solid var(--border-soft);
      display: flex; flex-direction: column; align-items: flex-end; justify-content: center; gap: 10px;
    }
    .bc-fare { font-family: var(--font-display); font-size: 1.4rem; color: var(--gold); }
    .bc-actions { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }

    .empty-state {
      text-align: center; padding: 80px 0; color: var(--white-dim);
      h3 { font-size: 1.6rem; color: var(--white); margin-bottom: 8px; }
      p { font-size: 14px; line-height: 1.6; }
      a { color: var(--gold); }
    }
    .empty-state.compact { padding: 34px 0; }

    .close-btn {
      background: none; border: none; color: var(--white-dim);
      font-size: 18px; cursor: pointer; padding: 4px; line-height: 1;
      &:hover { color: var(--white); }
    }

    @media (max-width: 900px) {
      .dash-stats { grid-template-columns: repeat(2, 1fr); }
      .ops-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 600px) {
      .booking-card { flex-direction: column; }
      .bc-right {
        flex: none; width: 100%; border-left: none; border-top: 1px solid var(--border-soft);
        flex-direction: row; justify-content: space-between;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  bookingSvc = inject(BookingService);
  flightSvc = inject(FlightService);
  router = inject(Router);
  toast = inject(ToastService);

  loading = false;
  flights: Flight[] = [];
  bookings: Booking[] = [];
  activeTab = 'ALL';
  cancelTarget: Booking | null = null;
  cancelReason = '';
  cancelling = false;
  analytics = { totalBookings: 0, totalRevenue: 0 };

  tabs = [
    { label: 'All Trips', value: 'ALL' },
    { label: 'Upcoming', value: 'CONFIRMED' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Cancelled', value: 'CANCELLED' },
    { label: 'Completed', value: 'COMPLETED' }
  ];

  get role(): string {
    return this.auth.getRole();
  }

  get isOperationsUser(): boolean {
    return this.role === 'ADMIN' || this.role === 'AIRLINE_STAFF';
  }

  get isAdmin(): boolean {
    return this.role === 'ADMIN';
  }

  get roleHeading(): string {
    return this.isAdmin ? 'Admin dashboard' : 'Airline staff dashboard';
  }

  get filteredBookings(): Booking[] {
    if (this.activeTab === 'ALL') return this.bookings;
    return this.bookings.filter(b => b.status === this.activeTab);
  }

  get upcoming(): Booking[] {
    return this.bookings.filter(b => b.status === 'CONFIRMED');
  }

  get confirmed(): number {
    return this.bookings.filter(b => b.status === 'CONFIRMED').length;
  }

  get totalSpend(): number {
    return this.bookings.filter(b => b.status !== 'CANCELLED').reduce((s, b) => s + b.totalFare, 0);
  }

  get recentBookings(): Booking[] {
    return [...this.bookings].slice(0, 5);
  }

  get visibleFlights(): Flight[] {
    return this.flights.slice(0, 6);
  }

  get opsStats(): OpsStat[] {
    const totalFlights = this.flights.length;
    const activeFlights = this.flights.filter(f => f.status !== 'CANCELLED').length;
    const availableSeats = this.flights.reduce((sum, f) => sum + (f.availableSeats || 0), 0);
    const routes = new Set(this.flights.map(f => `${f.originAirportCode}-${f.destinationAirportCode}`)).size;

    if (this.isAdmin) {
      return [
        { value: totalFlights, label: 'Total Flights' },
        { value: activeFlights, label: 'Active Flights' },
        { value: `Rs ${this.analytics.totalRevenue.toLocaleString('en-IN')}`, label: 'Revenue' },
        { value: this.analytics.totalBookings, label: 'Bookings' }
      ];
    }

    return [
      { value: totalFlights, label: 'Total Flights' },
      { value: activeFlights, label: 'Active Flights' },
      { value: availableSeats, label: 'Seats Available' },
      { value: routes, label: 'Routes' }
    ];
  }

  ngOnInit() {
    if (this.isOperationsUser) {
      this.loadOperationsDashboard();
      return;
    }
    this.loadPassengerDashboard();
  }

  loadOperationsDashboard() {
    this.loading = true;
    forkJoin({
      flights: this.flightSvc.getAllFlights().pipe(catchError(() => of([] as Flight[]))),
      analytics: this.isAdmin
        ? this.bookingSvc.getPlatformAnalytics().pipe(catchError(() => of({ totalBookings: 0, totalRevenue: 0 })))
        : of({ totalBookings: 0, totalRevenue: 0 }),
      bookings: this.isAdmin
        ? this.bookingSvc.getAllBookings().pipe(catchError(() => of([] as Booking[])))
        : of([] as Booking[])
    }).subscribe({
      next: ({ flights, analytics, bookings }) => {
        this.flights = flights;
        this.analytics = analytics;
        this.bookings = bookings;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.error('Could not load the dashboard');
      }
    });
  }

  loadPassengerDashboard() {
    this.loading = true;
    this.bookingSvc.getMyBookings().subscribe({
      next: b => { this.bookings = b; this.loading = false; },
      error: () => { this.loading = false; this.toast.error('Could not load trips'); }
    });
  }

  openRoute(flight: Flight) {
    this.router.navigate(['/flights'], {
      queryParams: {
        origin: flight.originAirportCode,
        destination: flight.destinationAirportCode,
        date: flight.departureTime.slice(0, 10),
        passengers: 1,
        seatClass: 'ECONOMY'
      }
    });
  }

  getStatusBadge(status: string): string {
    if (status === 'CONFIRMED') return 'success';
    if (status === 'CANCELLED') return 'error';
    if (status === 'PENDING') return 'gold';
    return 'neutral';
  }

  getFlightStatusBadge(status: string): string {
    const normalized = status.toUpperCase();
    if (normalized === 'ON_TIME' || normalized === 'SCHEDULED') return 'success';
    if (normalized === 'DELAYED') return 'gold';
    if (normalized === 'CANCELLED') return 'error';
    return 'neutral';
  }

  getBookingBadge(status: string): string {
    if (status === 'CONFIRMED') return 'success';
    if (status === 'CANCELLED') return 'error';
    if (status === 'PENDING') return 'gold';
    return 'neutral';
  }

  checkIn(bookingId: string) {
    this.bookingSvc.checkIn(bookingId).subscribe({
      next: () => {
        this.bookings = this.bookings.map(b => b.bookingId === bookingId ? { ...b, checkedIn: true } : b);
        this.toast.success('Checked in successfully!');
      },
      error: () => this.toast.error('Check-in failed')
    });
  }

  confirmCancel(b: Booking) {
    this.cancelTarget = b;
    this.cancelReason = '';
  }

  cancelBooking() {
    if (!this.cancelTarget) return;
    this.cancelling = true;
    this.bookingSvc.cancelBooking(this.cancelTarget.bookingId, this.cancelReason || 'User requested cancellation').subscribe({
      next: () => {
        this.bookings = this.bookings.map(b =>
          b.bookingId === this.cancelTarget!.bookingId ? { ...b, status: 'CANCELLED' } : b
        );
        this.toast.success('Booking cancelled');
        this.cancelTarget = null;
        this.cancelling = false;
      },
      error: () => {
        this.toast.error('Cancellation failed');
        this.cancelling = false;
      }
    });
  }

  getPrice(flight: Flight): number {
    return flight.basePrice;
  }

  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  getAirlineName(id: number): string {
    const names: Record<number, string> = { 1: 'IndiGo', 2: 'Air India', 3: 'SpiceJet', 4: 'Vistara', 5: 'GoAir' };
    return names[id] || `Airline ${id}`;
  }
}
