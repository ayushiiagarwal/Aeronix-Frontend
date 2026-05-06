import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { BookingService } from '../../core/services/booking.service';
import { FlightService } from '../../core/services/flight.service';
import { PaymentService } from '../../core/services/payment.service';
import { PassengerService } from '../../core/services/passenger.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { Booking, Flight, Passenger, Payment } from '../../shared/models';

@Component({
  selector: 'app-pnr-lookup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
  <div class="page">
    <div class="container" style="padding-top:48px;padding-bottom:80px">
      <div class="lookup-hero">
        <div>
          <h2>Find your booking by PNR</h2>
          <p class="text-dim">
            Search any booking using the 6-character PNR code.
          </p>
        </div>
        <div class="lookup-actions">
          <a routerLink="/flights" class="btn btn-ghost">Search Flights</a>
          <a routerLink="/dashboard" class="btn btn-primary" *ngIf="auth.isAuthenticated()">My Dashboard</a>
        </div>
      </div>

      <div class="lookup-grid">
        <div class="lookup-panel card">
          <h3>PNR Search</h3>
          <p class="lookup-sub">Enter the booking reference you received after payment.</p>

          <div class="form-group" style="margin-top:18px">
            <label>PNR Code</label>
            <input
              type="text"
              class="input"
              [(ngModel)]="pnrCode"
              maxlength="6"
              placeholder="ABC123"
              (keyup.enter)="search()">
          </div>

          <button class="btn btn-primary" style="margin-top:18px;width:100%;justify-content:center"
            (click)="search()" [disabled]="loading">
            @if (loading) { <span class="spinner" style="width:16px;height:16px"></span> }
            Find Booking
          </button>

          @if (error) {
            <div class="auth-error" style="margin-top:16px">{{ error }}</div>
          }

          <div class="lookup-note">
            You can use this after booking, cancellation, or payment to review your record and status.
          </div>
        </div>

        <div class="lookup-result card">
          @if (!searched) {
            <div class="empty-state">
              <div style="font-size:3rem;margin-bottom:16px">PNR</div>
              <h3>Search for a booking</h3>
              <p>Your booking summary, payment state, and flight details will appear here.</p>
            </div>
          } @else if (loading) {
            <div style="display:flex;align-items:center;gap:16px;padding:60px 0">
              <div class="spinner"></div>
              <span class="text-dim">Looking up booking...</span>
            </div>
          } @else if (!booking) {
            <div class="empty-state">
              <div style="font-size:3rem;margin-bottom:16px">No result</div>
              <h3>No booking found</h3>
              <p>Check the PNR code and try again.</p>
            </div>
          } @else {
            <div class="result-header">
              <div>
                <div class="eyebrow text-gold">Booking found</div>
                <h3>{{ booking.pnrCode }}</h3>
              </div>
              <span class="badge badge-{{ getBadge(booking.status) }}">{{ booking.status }}</span>
            </div>

            <div class="result-grid">
              <div class="result-card">
                <div class="label">Trip Type</div>
                <div class="value">{{ booking.tripType }}</div>
              </div>
              <div class="result-card">
                <div class="label">Passengers</div>
                <div class="value">{{ booking.passengerCount }}</div>
              </div>
              <div class="result-card">
                <div class="label">Seat Class</div>
                <div class="value">{{ booking.seatClass }}</div>
              </div>
              <div class="result-card">
                <div class="label">Total Fare</div>
                <div class="value">Rs {{ booking.totalFare | number }}</div>
              </div>
            </div>

            <div class="detail-block">
              <div class="detail-row"><span>Booked At</span><strong>{{ booking.bookedAt | slice:0:19 }}</strong></div>
              <div class="detail-row"><span>Contact Email</span><strong>{{ booking.contactEmail }}</strong></div>
              <div class="detail-row"><span>Contact Phone</span><strong>{{ booking.contactPhone }}</strong></div>
              <div class="detail-row"><span>Checked In</span><strong>{{ booking.checkedIn ? 'Yes' : 'No' }}</strong></div>
            </div>

            @if (flight) {
              <div class="flight-panel">
                <div class="section-head">
                  <div class="eyebrow text-gold">Flight</div>
                  <h4>{{ flight.flightNumber }}</h4>
                </div>
                <div class="route-line">
                  <div>
                    <div class="route-time">{{ flight.departureTime | slice:11:16 }}</div>
                    <div class="route-code">{{ flight.originAirportCode }}</div>
                  </div>
                  <div class="route-mid">{{ formatDuration(flight.durationMinutes) }}</div>
                  <div class="right">
                    <div class="route-time">{{ flight.arrivalTime | slice:11:16 }}</div>
                    <div class="route-code">{{ flight.destinationAirportCode }}</div>
                  </div>
                </div>
              </div>
            }

            @if (payment) {
              <div class="payment-panel">
                <div class="section-head">
                  <div class="eyebrow text-gold">Payment</div>
                  <h4>{{ payment.status }}</h4>
                </div>
                <div class="detail-row"><span>Payment ID</span><strong>{{ payment.paymentId }}</strong></div>
                <div class="detail-row"><span>Mode</span><strong>{{ payment.paymentMode }}</strong></div>
                <div class="detail-row"><span>Amount</span><strong>Rs {{ payment.amount | number }}</strong></div>
              </div>
            }

            <div class="result-actions">
              @if (payment) {
                <a class="btn btn-ghost" [routerLink]="['/booking/confirmation']" [queryParams]="{ bookingId: booking.bookingId }">
                  View Confirmation
                </a>
                <button class="btn btn-ghost" type="button" (click)="printTicket()">Print Ticket</button>
                <button class="btn btn-outline" type="button" (click)="copyPnr()">Copy PNR</button>
              } @else if (auth.isAuthenticated() && auth.getRole() === 'PASSENGER') {
                <a class="btn btn-primary" routerLink="/dashboard">Go to My Bookings</a>
              } @else {
                <a class="btn btn-primary" routerLink="/auth/login">Sign In</a>
              }
            </div>

            @if (passengers.length > 0) {
              <div class="passenger-panel">
                <div class="section-head">
                  <div class="eyebrow text-gold">Passengers</div>
                  <h4>{{ passengers.length }} traveller{{ passengers.length > 1 ? 's' : '' }}</h4>
                </div>
                <div class="passenger-list">
                  @for (p of passengers; track p.passengerId) {
                    <div class="passenger-item">
                      <div>
                        <strong>{{ p.title || 'Mr/Ms' }} {{ p.firstName }} {{ p.lastName }}</strong>
                        <div class="text-dim">{{ p.passengerType }} · {{ p.gender }} · {{ p.nationality || 'N/A' }}</div>
                      </div>
                      <div class="text-dim">
                        Seat: {{ p.seatNumber || 'TBD' }}
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
          }
        </div>
      </div>
    </div>
  </div>
  `,
  styles: [`
    .lookup-hero {
      display:flex; align-items:flex-start; justify-content:space-between;
      gap:20px; flex-wrap:wrap; margin-bottom:28px;
    }
    .lookup-hero h2 {
      font-family: var(--font-display);
      font-size: 2.2rem;
      margin: 0 0 8px;
    }
    .lookup-actions { display:flex; gap:10px; flex-wrap:wrap; }
    .eyebrow {
      font-size: 11px; text-transform: uppercase; letter-spacing: 0.14em;
      margin-bottom: 6px;
    }
    .lookup-grid {
      display:grid;
      grid-template-columns: 320px 1fr;
      gap: 18px;
      align-items:start;
    }
    .lookup-panel, .lookup-result {
      padding: 24px;
    }
    .lookup-panel h3, .lookup-result h3, .section-head h4 {
      font-family: var(--font-display);
      margin: 0;
    }
    .lookup-sub, .lookup-note {
      font-size: 13px;
      color: var(--white-dim);
      line-height: 1.6;
    }
    .lookup-note {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--border-soft);
    }
    .lookup-result {
      min-height: 320px;
    }
    .result-header {
      display:flex; justify-content:space-between; gap:12px; align-items:flex-start;
      margin-bottom: 18px;
    }
    .result-grid {
      display:grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 10px;
      margin-bottom: 18px;
    }
    .result-card {
      background: var(--midnight);
      border: 1px solid var(--border-soft);
      border-radius: var(--radius);
      padding: 14px;
    }
    .label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--gold-dim);
      margin-bottom: 8px;
    }
    .value {
      font-family: var(--font-display);
      font-size: 1.1rem;
      color: var(--white);
    }
    .detail-block, .flight-panel, .payment-panel {
      border-top: 1px solid var(--border-soft);
      padding-top: 16px;
      margin-top: 16px;
    }
    .detail-row {
      display:flex; justify-content:space-between; gap:16px;
      padding: 8px 0;
      font-size: 13px;
      color: var(--white-dim);
      border-bottom: 1px dashed rgba(255,255,255,0.06);
    }
    .detail-row strong { color: var(--white); font-weight: 500; text-align:right; }
    .section-head { margin-bottom: 12px; }
    .route-line {
      display:flex; align-items:center; justify-content:space-between; gap:10px;
      padding: 14px 0;
    }
    .route-time {
      font-family: var(--font-display);
      font-size: 1.4rem;
      color: var(--white);
      line-height: 1;
    }
    .route-code {
      font-size: 11px;
      color: var(--white-dim);
      letter-spacing: 0.08em;
      margin-top: 4px;
    }
    .route-mid {
      font-size: 11px;
      color: var(--white-dim);
      white-space: nowrap;
    }
    .result-actions {
      display:flex; gap:10px; flex-wrap:wrap;
      margin-top: 18px;
    }
    .passenger-panel {
      margin-top: 18px;
      border-top: 1px solid var(--border-soft);
      padding-top: 16px;
    }
    .passenger-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .passenger-item {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 14px;
      background: var(--midnight);
      border: 1px solid var(--border-soft);
      border-radius: var(--radius);
    }
    .auth-error {
      background: rgba(224,92,92,0.12);
      border: 1px solid rgba(224,92,92,0.3);
      border-radius: var(--radius);
      color: var(--error);
      font-size: 13px;
      padding: 10px 14px;
    }
    .empty-state {
      text-align:center; padding: 60px 0; color: var(--white-dim);
    }
    .empty-state h3 {
      font-family: var(--font-display);
      color: var(--white);
      font-size: 1.6rem;
      margin: 0 0 8px;
    }
    @media (max-width: 900px) {
      .lookup-grid { grid-template-columns: 1fr; }
      .result-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 600px) {
      .result-grid { grid-template-columns: 1fr; }
      .result-header { flex-direction:column; }
    }
  `]
})
export class PnrLookupComponent {
  bookingSvc = inject(BookingService);
  flightSvc = inject(FlightService);
  paymentSvc = inject(PaymentService);
  passengerSvc = inject(PassengerService);
  toast = inject(ToastService);
  auth = inject(AuthService);

  pnrCode = '';
  loading = false;
  searched = false;
  error = '';
  booking: Booking | null = null;
  flight: Flight | null = null;
  payment: Payment | null = null;
  passengers: Passenger[] = [];

  search() {
    const pnr = this.pnrCode.trim().toUpperCase();
    if (!pnr) {
      this.toast.error('Please enter a PNR code');
      return;
    }

    this.loading = true;
    this.searched = true;
    this.error = '';
    this.booking = null;
    this.flight = null;
    this.payment = null;

    this.bookingSvc.getBookingByPnr(pnr).subscribe({
      next: (booking) => {
        this.booking = booking;
        const flight$ = this.flightSvc.getFlightById(booking.flightId).pipe(catchError(() => of(null)));
        const payment$ = this.paymentSvc.getPaymentByBooking(booking.bookingId).pipe(catchError(() => of(null)));
        const passengers$ = this.passengerSvc.getByBooking(booking.bookingId).pipe(catchError(() => of([] as Passenger[])));
        forkJoin({ flight: flight$, payment: payment$, passengers: passengers$ }).subscribe({
          next: ({ flight, payment, passengers }) => {
            this.flight = flight;
            this.payment = payment;
            this.passengers = passengers;
            this.loading = false;
          },
          error: () => {
            this.loading = false;
          }
        });
      },
      error: () => {
        this.loading = false;
        this.error = 'No booking found for that PNR';
        this.toast.error(this.error);
      }
    });
  }

  printTicket() {
    window.print();
  }

  getBadge(status: string): string {
    const normalized = status.toUpperCase();
    if (normalized === 'CONFIRMED') return 'success';
    if (normalized === 'CANCELLED') return 'error';
    if (normalized === 'PENDING') return 'gold';
    return 'neutral';
  }

  formatDuration(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  }

  async copyPnr() {
    try {
      await navigator.clipboard.writeText(this.booking?.pnrCode || '');
      this.toast.success('PNR copied');
    } catch {
      this.toast.error('Could not copy PNR');
    }
  }
}
