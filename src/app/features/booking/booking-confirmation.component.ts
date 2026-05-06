import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TitlecasePipe } from '../../shared/pipes/titlecase.pipe';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { BookingService } from '../../core/services/booking.service';
import { Booking } from '../../shared/models';

@Component({
  selector: 'app-booking-confirmation',
  standalone: true,
  imports: [CommonModule, RouterLink, TitlecasePipe],
  template: `
  <div class="page">
    <div class="container" style="padding-top:80px;padding-bottom:80px;max-width:700px">
      @if (loading) {
        <div style="display:flex;align-items:center;gap:16px;padding:60px 0">
          <div class="spinner"></div><span style="color:var(--white-dim)">Loading confirmation...</span>
        </div>
      } @else if (booking) {
        <div class="confirm-wrap fade-in">
          <div class="success-icon">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="22" stroke="var(--success)" stroke-width="2"/>
              <path d="M14 24l7 7 13-13" stroke="var(--success)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h2>Booking Confirmed!</h2>
          <p class="confirm-sub">Your flight has been booked successfully. Check your email for the e-ticket.</p>

          <div class="ticket-card">
            <div class="ticket-header">
              <span class="logo-text" style="font-family:var(--font-display);letter-spacing:.15em;color:var(--gold)">AERONIX</span>
              <span class="badge badge-success">{{ booking.status }}</span>
            </div>

            <div class="ticket-body">
              <div class="ticket-pnr">
                <div class="pnr-label">PNR Code</div>
                <div class="pnr-value">{{ booking.pnrCode }}</div>
              </div>
              <div class="ticket-divider">
                <div class="perforation"></div>
              </div>
              <div class="ticket-details">
                <div class="td-item">
                  <span class="td-label">Flight</span>
                  <span>{{ booking.flightId }}</span>
                </div>
                <div class="td-item">
                  <span class="td-label">Class</span>
                  <span>{{ booking.seatClass }}</span>
                </div>
                <div class="td-item">
                  <span class="td-label">Passengers</span>
                  <span>{{ booking.passengerCount }}</span>
                </div>
                <div class="td-item">
                  <span class="td-label">Trip Type</span>
                  <span>{{ booking.tripType | titlecase }}</span>
                </div>
                <div class="td-item">
                  <span class="td-label">Total Fare</span>
                  <span class="text-gold" style="font-size:1.1rem;font-family:var(--font-display)">₹{{ booking.totalFare | number }}</span>
                </div>
                <div class="td-item">
                  <span class="td-label">Booking ID</span>
                  <span style="font-size:11px;color:var(--white-dim)">{{ booking.bookingId }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="confirm-actions">
            <a routerLink="/dashboard" class="btn btn-primary">View My Trips</a>
            <a routerLink="/flights" class="btn btn-ghost">Book Another Flight</a>
            <button class="btn btn-outline" type="button" (click)="printTicket()">Print / Save as PDF</button>
          </div>

          <div class="info-steps stagger">
            <div class="info-step">
              <div class="is-num">1</div>
              <div class="is-text">E-ticket sent to {{ booking.contactEmail }}</div>
            </div>
            <div class="info-step">
              <div class="is-num">2</div>
              <div class="is-text">Web check-in opens 24 hours before departure</div>
            </div>
            <div class="info-step">
              <div class="is-num">3</div>
              <div class="is-text">Arrive at airport 2 hours before departure</div>
            </div>
          </div>
        </div>
      }
    </div>
  </div>
  `,
  styles: [`
    .confirm-wrap { text-align: center; }
    .success-icon {
      width: 80px; height: 80px; border-radius: 50%;
      background: rgba(76,175,120,0.1);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 24px;
    }
    h2 { font-size: 2.5rem; margin-bottom: 12px; }
    .confirm-sub { color: var(--white-dim); margin-bottom: 40px; font-size: 15px; }

    .ticket-card {
      background: var(--navy-light); border: 1px solid var(--border);
      border-radius: var(--radius-lg); overflow: hidden; text-align: left;
      box-shadow: var(--shadow-gold); margin-bottom: 32px;
    }
    .ticket-header {
      padding: 20px 28px; display: flex; justify-content: space-between; align-items: center;
      border-bottom: 1px solid var(--border-soft);
      background: linear-gradient(135deg, var(--navy-mid), var(--navy));
    }
    .ticket-body { padding: 28px; }
    .ticket-pnr { margin-bottom: 24px; }
    .pnr-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.14em; color: var(--gold-dim); margin-bottom: 6px; }
    .pnr-value {
      font-family: var(--font-display); font-size: 3rem; font-weight: 300;
      color: var(--gold); letter-spacing: 0.15em; line-height: 1;
    }
    .ticket-divider { height: 1px; background: var(--border-soft); margin: 20px 0; position: relative; }
    .perforation {
      position: absolute; top: -6px; left: 50%; transform: translateX(-50%);
      display: flex; gap: 4px;
      &::after { content: '✂'; color: var(--border); font-size: 12px; }
    }
    .ticket-details { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .td-item { display: flex; flex-direction: column; gap: 4px; font-size: 14px; }
    .td-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--gold-dim); }

    .confirm-actions { display: flex; gap: 16px; justify-content: center; margin-bottom: 40px; flex-wrap: wrap; }

    .info-steps { display: flex; flex-direction: column; gap: 12px; text-align: left; }
    .info-step {
      display: flex; align-items: center; gap: 14px; padding: 14px 16px;
      background: var(--navy-light); border: 1px solid var(--border-soft);
      border-radius: var(--radius);
    }
    .is-num {
      width: 28px; height: 28px; border-radius: 50%;
      background: var(--gold); color: var(--midnight);
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 600; flex-shrink: 0;
    }
    .is-text { font-size: 13px; color: var(--white-dim); }

    @media (max-width: 600px) {
      .ticket-details { grid-template-columns: repeat(2, 1fr); }
    }
  `]
})
export class BookingConfirmationComponent implements OnInit {
  bookingSvc = inject(BookingService);
  route = inject(ActivatedRoute);
  booking: Booking | null = null;
  loading = false;

  ngOnInit() {
    this.route.queryParams.subscribe(p => {
      if (p['bookingId']) {
        this.loading = true;
        this.bookingSvc.getBookingById(p['bookingId']).subscribe({
          next: b => { this.booking = b; this.loading = false; },
          error: () => this.loading = false
        });
      }
    });
  }

  printTicket() {
    window.print();
  }
}
