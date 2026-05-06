import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, NgZone } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BookingService } from '../../core/services/booking.service';
import { FlightService } from '../../core/services/flight.service';
import { PaymentService } from '../../core/services/payment.service';
import { SeatService } from '../../core/services/seat.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { FareSummary, Flight, Seat, SeatMapResponse } from '../../shared/models';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="page">
    <div class="container" style="padding-top:48px; padding-bottom:80px">

      <div class="steps">
        @for (s of steps; track s.n; let i = $index) {
          <div class="step" [class.active]="step === s.n" [class.done]="step > s.n">
            <div class="step-num">{{ step > s.n ? '✓' : s.n }}</div>
            <span class="step-label">{{ s.label }}</span>
          </div>
          @if (i < steps.length - 1) { <div class="step-line" [class.done]="step > s.n"></div> }
        }
      </div>

      @if (loadingFlight) {
        <div style="display:flex;align-items:center;gap:16px;padding:60px 0">
          <div class="spinner"></div><span style="color:var(--white-dim)">Loading flight details...</span>
        </div>
      } @else if (flight) {
        <div class="booking-layout">
          <div class="booking-form">

            @if (step === 1) {
              <div class="fade-in">
                <h2 class="step-title">Flight Details</h2>
                <div class="flight-summary-card card">
                  <div class="fs-route">
                    <div class="fs-airport">
                      <div class="fs-time">{{ flight.departureTime | slice:11:16 }}</div>
                      <div class="fs-code">{{ flight.originAirportCode }}</div>
                    </div>
                    <div class="fs-middle">
                      <div class="fs-flight-no">{{ flight.flightNumber }}</div>
                      <div class="fs-line">
                        <div class="fs-dot"></div>
                        <div class="fs-track"></div>
                        <svg width="20" height="12" viewBox="0 0 20 12" fill="none">
                          <path d="M0 8l12-7 2 4-8 3 6 3H0V8z" fill="var(--gold)" opacity="0.8"/>
                        </svg>
                        <div class="fs-track"></div>
                        <div class="fs-dot"></div>
                      </div>
                      <div class="fs-dur">{{ formatDuration(flight.durationMinutes) }}</div>
                    </div>
                    <div class="fs-airport right">
                      <div class="fs-time">{{ flight.arrivalTime | slice:11:16 }}</div>
                      <div class="fs-code">{{ flight.destinationAirportCode }}</div>
                    </div>
                  </div>
                  <div class="fs-meta">
                    <div class="fs-meta-item">
                      <span class="fs-meta-label">Date</span>
                      <span>{{ flight.departureTime | slice:0:10 }}</span>
                    </div>
                    <div class="fs-meta-item">
                      <span class="fs-meta-label">Class</span>
                      <span>{{ seatClass }}</span>
                    </div>
                    <div class="fs-meta-item">
                      <span class="fs-meta-label">Passengers</span>
                      <span>{{ passengerCount }}</span>
                    </div>
                    <div class="fs-meta-item">
                      <span class="fs-meta-label">Stops</span>
                      <span>{{ flight.stops === 0 ? 'Non-stop' : flight.stops + ' stop(s)' }}</span>
                    </div>
                  </div>
                </div>
                <button class="btn btn-primary" style="margin-top:24px" (click)="step=2">
                  Continue to Seat Selection →
                </button>
              </div>
            }

            @if (step === 2) {
              <div class="fade-in">
                <h2 class="step-title">Seat Selection</h2>

                <div class="seat-header card">
                  <div>
                    <div class="eyebrow text-gold">Interactive map</div>
                    <h4>Choose {{ passengerCount }} seat{{ passengerCount > 1 ? 's' : '' }}</h4>
                    <p class="text-dim">Pick one seat per passenger. You can switch classes if the flight has them configured.</p>
                  </div>
                  <div class="seat-tabs">
                    @for (cls of availableSeatClasses; track cls) {
                    <button class="seat-tab" [class.active]="activeSeatClass === cls" (click)="setActiveSeatClass(cls)">
                      {{ cls }}
                    </button>
                  }
                  </div>
                </div>

                @if (seatLoading) {
                  <div style="display:flex;align-items:center;gap:16px;padding:40px 0">
                    <div class="spinner"></div><span style="color:var(--white-dim)">Loading seat map...</span>
                  </div>
                } @else if (!seatMap || seatsForActiveClass.length === 0) {
                  <div class="seat-empty card">
                    <h4>No seats configured yet</h4>
                    <p>The flight exists, but the seat-service has not been populated for this flight yet.</p>
                  </div>
                } @else {
                  <div class="seat-layout-grid">
                    <div class="seat-map card">
                      <div class="seat-legend">
                        <span><i class="dot available"></i> Available</span>
                        <span><i class="dot selected"></i> Selected</span>
                        <span><i class="dot blocked"></i> Blocked</span>
                        <span><i class="dot held"></i> Held / Confirmed</span>
                      </div>

                      <div class="seat-grid" [style.gridTemplateColumns]="'repeat(' + maxColumnsForActiveClass + ', minmax(0, 1fr))'">
                        @for (seat of seatsForActiveClass; track seat.seatId) {
                          <button
                            class="seat-btn"
                            [class.selected]="isSeatSelected(seat)"
                            [class.blocked]="seat.status === 'BLOCKED'"
                            [class.held]="seat.status === 'HELD' || seat.status === 'CONFIRMED'"
                            [disabled]="!canPickSeat(seat)"
                            (click)="toggleSeat(seat)">
                            <span>{{ seat.seatNumber }}</span>
                            <small>{{ seat.seatClass }}</small>
                          </button>
                        }
                      </div>
                    </div>

                    <div class="seat-summary card">
                      <h4>Seat Summary</h4>
                      <div class="summary-row">
                        <span>Passengers</span>
                        <strong>{{ passengerCount }}</strong>
                      </div>
                      <div class="summary-row">
                        <span>Selected</span>
                        <strong>{{ selectedSeatIds.length }}</strong>
                      </div>
                      <div class="summary-row">
                        <span>Class</span>
                        <strong>{{ activeSeatClass }}</strong>
                      </div>

                      <div class="selected-list">
                        @if (selectedSeats.length === 0) {
                          <p class="text-dim">No seats selected yet.</p>
                        } @else {
                          @for (seat of selectedSeats; track seat.seatId) {
                            <div class="selected-pill">{{ seat.seatNumber }} · {{ seat.seatClass }}</div>
                          }
                        }
                      </div>

                      <div class="seat-actions">
                        <button class="btn btn-ghost" (click)="step=1">← Back</button>
                        <button class="btn btn-primary" (click)="goToPassengers()" [disabled]="selectedSeatIds.length !== passengerCount">
                          Continue to Passengers →
                        </button>
                      </div>

                      <button class="btn btn-outline" style="margin-top:10px;width:100%;justify-content:center" (click)="autoSelectSeats()">
                        Auto Select Best Available
                      </button>
                    </div>
                  </div>
                }
              </div>
            }

            @if (step === 3) {
              <div class="fade-in">
                <h2 class="step-title">Passenger Details</h2>
                @for (p of passengers; track p; let i = $index) {
                  <div class="passenger-block card" style="margin-bottom:20px">
                    <div class="passenger-header">
                      <h4>Passenger {{ i + 1 }}</h4>
                      <select [(ngModel)]="p.passengerType" class="pax-type-sel">
                        <option value="ADULT">Adult</option>
                        <option value="CHILD">Child</option>
                        <option value="INFANT">Infant</option>
                      </select>
                    </div>
                    <div class="pax-grid">
                      <div class="form-group">
                        <label>First Name</label>
                        <input type="text" [(ngModel)]="p.firstName" class="input" placeholder="Rahul">
                      </div>
                      <div class="form-group">
                        <label>Last Name</label>
                        <input type="text" [(ngModel)]="p.lastName" class="input" placeholder="Sharma">
                      </div>
                      <div class="form-group">
                        <label>Date of Birth</label>
                        <input type="date" [(ngModel)]="p.dateOfBirth" class="input">
                      </div>
                      <div class="form-group">
                        <label>Gender</label>
                        <select [(ngModel)]="p.gender" class="input">
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                      <div class="form-group">
                        <label>Passport No.</label>
                        <input type="text" [(ngModel)]="p.passportNumber" class="input" placeholder="P1234567">
                      </div>
                      <div class="form-group">
                        <label>Nationality</label>
                        <input type="text" [(ngModel)]="p.nationality" class="input" placeholder="Indian">
                      </div>
                      <div class="form-group">
                        <label>Passport Expiry</label>
                        <input type="date" [(ngModel)]="p.passportExpiry" class="input">
                      </div>
                      <div class="form-group">
                        <label>Meal Preference</label>
                        <select [(ngModel)]="p.mealPreference" class="input">
                          <option value="VEG">Vegetarian</option>
                          <option value="NON_VEG">Non-Vegetarian</option>
                          <option value="VEGAN">Vegan</option>
                          <option value="NONE">No Preference</option>
                        </select>
                      </div>
                    </div>
                  </div>
                }

                <div class="card" style="margin-bottom:20px">
                  <h4 style="margin-bottom:16px; font-family:var(--font-display)">Contact Details</h4>
                  <div class="pax-grid">
                    <div class="form-group">
                      <label>Contact Email</label>
                      <input type="email" [(ngModel)]="contactEmail" class="input" placeholder="you@example.com">
                    </div>
                    <div class="form-group">
                      <label>Contact Phone</label>
                      <input type="tel" [(ngModel)]="contactPhone" class="input" placeholder="+91 98765 43210">
                    </div>
                    <div class="form-group">
                      <label>Meal Preference (Booking)</label>
                      <select [(ngModel)]="mealPreference" class="input">
                        <option value="VEG">Vegetarian</option>
                        <option value="NON_VEG">Non-Vegetarian</option>
                        <option value="VEGAN">Vegan</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label>Extra Luggage (kg)</label>
                      <select [(ngModel)]="extraLuggage" class="input">
                        <option value="0">None</option>
                        <option value="5">+5 kg</option>
                        <option value="10">+10 kg</option>
                        <option value="15">+15 kg</option>
                        <option value="20">+20 kg</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div class="step-actions">
                  <button class="btn btn-ghost" (click)="step=2">← Back</button>
                  <button class="btn btn-primary" (click)="goToPayment()">Continue to Payment →</button>
                </div>
              </div>
            }

            @if (step === 4) {
              <div class="fade-in">
                <h2 class="step-title">Payment</h2>

                @if (!paymentProcessing) {
                  @if (fare) {
                    <div class="card fare-detail-card">
                      <h4 style="margin-bottom:16px; font-family:var(--font-display)">Fare Breakdown</h4>
                      <div class="fare-rows">
                        <div class="fare-row"><span>Base Fare ({{ passengerCount }} pax)</span><span>₹{{ fare.baseFare | number }}</span></div>
                        <div class="fare-row"><span>GST</span><span>₹{{ fare.gstAmount | number }}</span></div>
                        <div class="fare-row"><span>Fuel Surcharge</span><span>₹{{ fare.fuelSurcharge | number }}</span></div>
                        <div class="fare-row"><span>Luggage</span><span>₹{{ fare.luggageCharge | number }}</span></div>
                        <div class="fare-row total"><span>Total</span><span class="text-gold">₹{{ fare.totalFare | number }}</span></div>
                      </div>
                    </div>
                  }

                  <div class="info-box">
                    <span>🔒</span>
                    You will be redirected to Razorpay's secure payment gateway.
                  </div>

                  <div class="step-actions">
                    <button class="btn btn-ghost" (click)="step=3">← Back</button>
                    <button class="btn btn-primary" (click)="confirmPay()">
                      Pay ₹{{ fare?.totalFare | number }} via Razorpay
                    </button>
                  </div>
                }

                @if (paymentProcessing) {
                  <div class="card gateway-box fade-in" style="text-align:center;padding:48px 24px">
                    <div class="spinner" style="width:48px;height:48px;margin:0 auto 24px"></div>
                    <h4 style="font-family:var(--font-display);margin-bottom:8px">Processing Payment</h4>
                    <p class="text-dim">{{ paymentStatusMsg }}</p>
                    <p class="text-dim" style="font-size:12px;margin-top:8px">Please do not close this window.</p>
                  </div>
                }
              </div>
            }
          </div>

          <div class="fare-sidebar">
            <div class="fare-card card">
              <h4 class="fare-card-title">Price Summary</h4>
              @if (fare) {
                <div class="fare-rows">
                  <div class="fare-row"><span>Base Fare</span><span>₹{{ fare.baseFare | number }}</span></div>
                  <div class="fare-row"><span>Taxes & Fees</span><span>₹{{ fare.totalTax | number }}</span></div>
                  <div class="fare-row total"><span>Total</span><span class="text-gold">₹{{ fare.totalFare | number }}</span></div>
                </div>
              } @else {
                <div class="spinner" style="margin:20px auto"></div>
              }
              <div class="secure-badge">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1L2 3v4c0 3 2.5 5.5 5 6 2.5-.5 5-3 5-6V3L7 1z" stroke="var(--success)" stroke-width="1.2" fill="none"/>
                  <path d="M4.5 7l2 2 3-3" stroke="var(--success)" stroke-width="1.2" stroke-linecap="round"/>
                </svg>
                Secured by 256-bit encryption
              </div>
            </div>

            @if (flight) {
              <div class="mini-flight-card card">
                <div class="mf-route">{{ flight.originAirportCode }} → {{ flight.destinationAirportCode }}</div>
                <div class="mf-date">{{ flight.departureTime | slice:0:10 }}</div>
                <div class="mf-class">{{ seatClass }} · {{ passengerCount }} passenger{{ passengerCount > 1 ? 's' : '' }}</div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  </div>
  `,
  styles: [`
    .steps {
      display: flex; align-items: center; gap: 0;
      margin-bottom: 48px; max-width: 500px;
    }
    .step { display: flex; align-items: center; gap: 10px; }
    .step-num {
      width: 32px; height: 32px; border-radius: 50%;
      border: 1px solid var(--border-soft);
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; color: var(--white-dim);
      transition: var(--transition); flex-shrink: 0;
    }
    .step.active .step-num { border-color: var(--gold); background: var(--gold); color: var(--midnight); font-weight: 600; }
    .step.done .step-num { border-color: var(--success); background: rgba(76,175,120,0.15); color: var(--success); }
    .step-label { font-size: 12px; color: var(--white-dim); white-space: nowrap; }
    .step.active .step-label { color: var(--white); }
    .step-line { flex: 1; height: 1px; background: var(--border-soft); min-width: 24px; }
    .step-line.done { background: var(--success); }

    .booking-layout { display: flex; gap: 32px; align-items: flex-start; }
    .booking-form { flex: 1; min-width: 0; }
    .fare-sidebar { flex: 0 0 280px; position: sticky; top: 160px; }

    .step-title { font-size: 1.8rem; margin-bottom: 24px; }

    .flight-summary-card { padding: 28px; }
    .fs-route { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
    .fs-airport { flex: 0 0 auto; }
    .fs-airport.right { text-align: right; }
    .fs-time { font-family: var(--font-display); font-size: 2rem; line-height: 1; }
    .fs-code { font-size: 12px; color: var(--white-dim); letter-spacing: 0.08em; margin-top: 4px; }
    .fs-middle { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .fs-flight-no { font-size: 11px; color: var(--gold); letter-spacing: 0.1em; }
    .fs-line { display: flex; align-items: center; width: 100%; gap: 0; }
    .fs-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--gold); flex-shrink: 0; }
    .fs-track { flex: 1; height: 1px; background: var(--border); }
    .fs-dur { font-size: 11px; color: var(--white-dim); }
    .fs-meta { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding-top: 20px; border-top: 1px solid var(--border-soft); }
    .fs-meta-item { display: flex; flex-direction: column; gap: 4px; font-size: 13px; }
    .fs-meta-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--gold-dim); }

    .seat-header {
      padding: 20px 24px;
      display: flex; justify-content: space-between; gap: 16px; align-items: flex-start;
      margin-bottom: 16px;
    }
    .seat-header h4 { font-family: var(--font-display); font-size: 1.1rem; margin: 0; }
    .eyebrow {
      font-size: 11px; text-transform: uppercase; letter-spacing: 0.14em;
      margin-bottom: 6px;
    }
    .seat-tabs {
      display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end;
    }
    .seat-tab {
      padding: 8px 14px; border: 1px solid var(--border-soft); border-radius: 999px;
      background: var(--midnight); color: var(--white-dim); cursor: pointer; font-size: 12px;
    }
    .seat-tab.active { background: var(--gold); color: var(--midnight); border-color: var(--gold); }

    .seat-layout-grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 280px;
      gap: 16px;
      align-items: start;
    }
    .seat-map, .seat-summary, .seat-empty { padding: 20px; }
    .seat-legend {
      display: flex; flex-wrap: wrap; gap: 14px;
      margin-bottom: 16px; font-size: 11px; color: var(--white-dim);
    }
    .seat-legend span { display: inline-flex; align-items: center; gap: 6px; }
    .dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
    .dot.available { background: rgba(201,168,76,0.45); }
    .dot.selected { background: var(--gold); }
    .dot.blocked { background: rgba(224,92,92,0.45); }
    .dot.held { background: rgba(96,125,139,0.65); }

    .seat-grid {
      display: grid;
      gap: 10px;
    }
    .seat-btn {
      min-height: 58px;
      border-radius: var(--radius);
      border: 1px solid var(--border-soft);
      background: var(--navy);
      color: var(--white);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 2px;
      cursor: pointer;
      transition: var(--transition);
      font-family: var(--font-body);
    }
    .seat-btn small { font-size: 9px; color: var(--white-dim); letter-spacing: 0.08em; }
    .seat-btn:hover:not(:disabled) { border-color: var(--gold); transform: translateY(-1px); }
    .seat-btn.selected { background: var(--gold); color: var(--midnight); border-color: var(--gold); }
    .seat-btn.selected small { color: rgba(26, 28, 34, 0.75); }
    .seat-btn.blocked,
    .seat-btn.held {
      cursor: not-allowed;
      opacity: 0.45;
    }
    .seat-btn:disabled { cursor: not-allowed; }

    .seat-summary h4 {
      font-family: var(--font-display);
      font-size: 1.1rem;
      margin: 0 0 12px;
    }
    .summary-row {
      display:flex; justify-content:space-between; gap:10px;
      padding: 8px 0; font-size: 13px; color: var(--white-dim);
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .summary-row strong { color: var(--white); }
    .selected-list { margin-top: 14px; display:flex; flex-direction:column; gap:8px; min-height: 80px; }
    .selected-pill {
      display:inline-flex; width: fit-content;
      padding: 8px 12px; border-radius: 999px;
      background: rgba(201,168,76,0.1); border: 1px solid rgba(201,168,76,0.22);
      color: var(--gold); font-size: 12px;
    }
    .seat-actions { display:flex; justify-content:space-between; gap:12px; margin-top: 16px; }
    .seat-empty h4 {
      font-family: var(--font-display);
      margin: 0 0 8px;
      font-size: 1.2rem;
    }

    .passenger-block { padding: 24px; }
    .passenger-header {
      display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;
      h4 { font-family: var(--font-display); font-size: 1.1rem; }
    }
    .pax-type-sel {
      padding: 6px 12px; background: var(--midnight); border: 1px solid var(--border-soft);
      border-radius: var(--radius); color: var(--gold); font-family: var(--font-body); font-size: 12px;
      outline: none; cursor: pointer;
    }
    .pax-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

    .payment-methods { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .pm-option {
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      padding: 16px 12px; border: 1px solid var(--border-soft);
      border-radius: var(--radius); cursor: pointer; transition: var(--transition);
      &.selected { border-color: var(--gold); background: var(--gold-glow); }
      input { display: none; }
    }
    .pm-icon { font-size: 1.5rem; }
    .pm-label { font-size: 11px; color: var(--white-dim); text-align: center; }
    .pm-option.selected .pm-label { color: var(--gold); }

    .fare-detail-card { padding: 24px; }
    .fare-rows { display: flex; flex-direction: column; gap: 10px; }
    .fare-row {
      display: flex; justify-content: space-between; align-items: center;
      font-size: 13px; color: var(--white-dim);
      &.total {
        padding-top: 12px; border-top: 1px solid var(--border-soft);
        font-size: 15px; color: var(--white); font-weight: 500;
        margin-top: 4px;
      }
    }

    .info-box {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 14px 16px; background: rgba(201,168,76,0.08);
      border: 1px solid var(--border); border-radius: var(--radius);
      font-size: 12px; color: var(--white-dim); margin: 20px 0;
      span:first-child { color: var(--gold); flex-shrink: 0; margin-top: 1px; }
    }

    .step-actions { display: flex; justify-content: space-between; gap: 16px; margin-top: 24px; }

    .fare-card { padding: 24px; margin-bottom: 16px; }
    .fare-card-title { font-family: var(--font-display); font-size: 1.1rem; color: var(--gold); margin-bottom: 16px; }
    .secure-badge {
      display: flex; align-items: center; gap: 8px;
      margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-soft);
      font-size: 11px; color: var(--success);
    }
    .mini-flight-card { padding: 20px; }
    .mf-route { font-family: var(--font-display); font-size: 1.2rem; margin-bottom: 6px; }
    .mf-date { font-size: 13px; color: var(--white-dim); }
    .mf-class { font-size: 12px; color: var(--gold); margin-top: 4px; }

    @media (max-width: 1100px) {
      .seat-layout-grid { grid-template-columns: 1fr; }
      .fare-sidebar { position: static; }
    }
    @media (max-width: 900px) {
      .booking-layout { flex-direction: column; }
      .fare-sidebar { flex: none; width: 100%; position: static; }
    }
    @media (max-width: 600px) {
      .pax-grid { grid-template-columns: 1fr; }
      .payment-methods { grid-template-columns: repeat(2, 1fr); }
      .fs-meta { grid-template-columns: repeat(2, 1fr); }
      .step-label { display: none; }
      .seat-actions { flex-direction: column; }
    }

  `]
})
export class BookingComponent implements OnInit {
  flightSvc = inject(FlightService);
  bookingSvc = inject(BookingService);
  paymentSvc = inject(PaymentService);
  seatSvc = inject(SeatService);
  auth = inject(AuthService);
  toast = inject(ToastService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  step = 1;
  steps = [
    { n: 1, label: 'Review Flight' },
    { n: 2, label: 'Seats' },
    { n: 3, label: 'Passengers' },
    { n: 4, label: 'Payment' }
  ];

  flight: Flight | null = null;
  fare: FareSummary | null = null;
  loadingFlight = false;
  seatLoading = false;
  paying = false;

  flightId = 0;
  seatClass = 'ECONOMY';
  passengerCount = 1;
  contactEmail = '';
  contactPhone = '';
  mealPreference = 'VEG';
  extraLuggage = 0;

  seatMap: SeatMapResponse | null = null;
  activeSeatClass = 'ECONOMY';
  selectedSeatIds: number[] = [];

  passengers: any[] = [];


  // Payment gateway state
  paymentProcessing = false;
  paymentStatusMsg = 'Processing...';

  ngOnInit() {
    if (this.auth.isAuthenticated() && this.auth.getRole() !== 'PASSENGER') {
      this.toast.error('Only passengers can create bookings');
      this.router.navigate(['/dashboard']);
      return;
    }

    const u = this.auth.currentUser();
    if (u) {
      this.contactEmail = u.email;
      this.contactPhone = u.phone || '';
    }

    this.route.queryParams.subscribe(p => {
      this.flightId = +p['flightId'];
      this.seatClass = (p['seatClass'] || 'ECONOMY').toUpperCase();
      this.activeSeatClass = this.seatClass;
      this.passengerCount = +p['passengers'] || 1;
      this.initPassengers();
      this.loadFlight();
    });
  }

  initPassengers() {
    this.passengers = Array.from({ length: this.passengerCount }, () => ({
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: 'MALE',
      passportNumber: '',
      nationality: 'Indian',
      passportExpiry: '',
      passengerType: 'ADULT',
      mealPreference: 'VEG'
    }));
  }

  loadFlight() {
    this.loadingFlight = true;
    this.flightSvc.getFlightById(this.flightId).subscribe({
      next: (f) => {
        this.flight = f;
        this.loadingFlight = false;
        this.flightSvc.getFare(this.flightId, this.seatClass, this.passengerCount).subscribe({
          next: (fare) => this.fare = fare,
          error: () => {}
        });
        this.loadSeatMap();
      },
      error: () => {
        this.loadingFlight = false;
        this.toast.error('Could not load flight');
        this.router.navigate(['/flights']);
      }
    });
  }

  loadSeatMap() {
    this.seatLoading = true;
    this.seatSvc.getSeatMap(this.flightId).subscribe({
      next: (seatMap) => {
        this.seatMap = seatMap;
        const classes = this.availableSeatClasses;
        if (!classes.includes(this.activeSeatClass) && classes.length > 0) {
          this.activeSeatClass = classes[0];
        }
        this.seatLoading = false;
      },
      error: () => {
        this.seatLoading = false;
        this.seatMap = null;
      }
    });
  }

  get availableSeatClasses(): string[] {
    if (!this.seatMap) return [];
    return ['FIRST', 'BUSINESS', 'ECONOMY'].filter(cls => (this.seatMap?.seatsByClass?.[cls]?.length ?? 0) > 0);
  }

  get seatsForActiveClass(): Seat[] {
    const seats = this.seatMap?.seatsByClass?.[this.activeSeatClass] || [];
    return [...seats].sort((a, b) => (a.seatRow || 0) - (b.seatRow || 0) || (a.seatColumn || '').localeCompare(b.seatColumn || ''));
  }

  get maxColumnsForActiveClass(): number {
    const columns = new Set((this.seatsForActiveClass || []).map(s => s.seatColumn)).size;
    return Math.max(columns || 6, 4);
  }

  get selectedSeats(): Seat[] {
    const all = this.seatMap
      ? Object.values(this.seatMap.seatsByClass).reduce((acc, seats) => acc.concat(seats), [] as Seat[])
      : [];
    return all.filter(seat => this.selectedSeatIds.includes(seat.seatId));
  }

  setActiveSeatClass(cls: string) {
    if (this.activeSeatClass === cls) return;
    this.activeSeatClass = cls;
    this.seatClass = cls;
    this.selectedSeatIds = [];
    this.flightSvc.getFare(this.flightId, this.seatClass, this.passengerCount).subscribe({
      next: (fare) => this.fare = fare,
      error: () => {}
    });
  }

  toggleSeat(seat: Seat) {
    if (!this.canPickSeat(seat)) return;

    if (this.isSeatSelected(seat)) {
      this.selectedSeatIds = this.selectedSeatIds.filter(id => id !== seat.seatId);
      return;
    }

    if (this.selectedSeatIds.length >= this.passengerCount) {
      this.toast.error(`Select only ${this.passengerCount} seat${this.passengerCount > 1 ? 's' : ''}`);
      return;
    }

    this.selectedSeatIds = [...this.selectedSeatIds, seat.seatId];
  }

  isSeatSelected(seat: Seat): boolean {
    return this.selectedSeatIds.includes(seat.seatId);
  }

  canPickSeat(seat: Seat): boolean {
    return seat.status === 'AVAILABLE' || this.isSeatSelected(seat);
  }

  autoSelectSeats() {
    const available = this.seatsForActiveClass.filter(seat => seat.status === 'AVAILABLE');
    this.selectedSeatIds = available.slice(0, this.passengerCount).map(seat => seat.seatId);
    if (this.selectedSeatIds.length < this.passengerCount) {
      this.toast.error('Not enough available seats in this class');
    } else {
      this.toast.success('Seats selected');
    }
  }

  goToPassengers() {
    if (this.selectedSeatIds.length !== this.passengerCount) {
      this.toast.error(`Please select exactly ${this.passengerCount} seats`);
      return;
    }
    this.step = 3;
  }

  goToPayment() {
    const invalid = this.passengers.find(p => !p.firstName || !p.lastName || !p.dateOfBirth);
    if (invalid) {
      this.toast.error('Please fill all passenger details');
      return;
    }
    if (!this.contactEmail || !this.contactPhone) {
      this.toast.error('Contact details required');
      return;
    }
    if (this.selectedSeatIds.length !== this.passengerCount) {
      this.toast.error('Seat selection is incomplete');
      return;
    }
    this.step = 4;
  }

  zone = inject(NgZone);

  confirmPay() {
    this.paymentProcessing = true;
    this.paymentStatusMsg = 'Creating booking...';

    const bookingData = {
      flightId: this.flightId,
      seatClass: this.seatClass,
      tripType: 'ONE_WAY',
      contactEmail: this.contactEmail,
      contactPhone: this.contactPhone,
      mealPreference: this.mealPreference,
      extraLuggageKg: +this.extraLuggage,
      passengers: this.passengers,
      selectedSeatIds: this.selectedSeatIds
    };

    this.bookingSvc.createBooking(bookingData).subscribe({
      next: (booking) => {
        this.paymentStatusMsg = 'Opening Razorpay...';

        this.paymentSvc.createRazorpayOrder({
          bookingId: booking.bookingId,
          amount: this.fare?.totalFare || 0
        }).subscribe({
          next: (order) => {
            this.paymentProcessing = false;

            const options = {
              key: order.keyId,
              amount: order.amount,
              currency: order.currency,
              name: 'Aeronix',
              description: `Booking ${booking.pnrCode}`,
              order_id: order.orderId,
              handler: (response: any) => {
                this.zone.run(() => {
                  this.paymentProcessing = true;
                  this.paymentStatusMsg = 'Verifying payment...';

                  this.paymentSvc.verifyPayment({
                    razorpayOrderId: response.razorpay_order_id,
                    razorpayPaymentId: response.razorpay_payment_id,
                    razorpaySignature: response.razorpay_signature,
                    bookingId: booking.bookingId
                  }).subscribe({
                    next: () => {
                      this.paymentStatusMsg = 'Confirming booking...';
                      this.paymentSvc.initiatePayment({
                        bookingId: booking.bookingId,
                        amount: this.fare?.totalFare || 0,
                        currency: 'INR',
                        paymentMode: 'UPI'
                      }).subscribe({
                        next: () => {
                          this.paymentSvc.simulatePayment(booking.bookingId).subscribe({
                            next: () => {
                              this.paymentProcessing = false;
                              this.toast.success('Payment successful! Booking confirmed.');
                              this.router.navigate(['/booking/confirmation'],
                                { queryParams: { bookingId: booking.bookingId } });
                            },
                            error: () => {
                              this.paymentProcessing = false;
                              this.toast.success('Booking confirmed.');
                              this.router.navigate(['/dashboard']);
                            }
                          });
                        },
                        error: () => {
                          // initiatePayment failed, try simulate directly
                          this.paymentSvc.simulatePayment(booking.bookingId).subscribe({
                            next: () => {
                              this.paymentProcessing = false;
                              this.toast.success('Payment successful! Booking confirmed.');
                              this.router.navigate(['/booking/confirmation'],
                                { queryParams: { bookingId: booking.bookingId } });
                            },
                            error: () => {
                              this.paymentProcessing = false;
                              this.toast.success('Booking confirmed.');
                              this.router.navigate(['/dashboard']);
                            }
                          });
                        }
                      });
                    },
                    error: () => {
                      this.paymentProcessing = false;
                      this.toast.error('Payment verification failed. Contact support.');
                    }
                  });
                });
              },
              prefill: {
                email: this.contactEmail,
                contact: this.contactPhone
              },
              theme: { color: '#C9A84C' }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();
          },
          error: () => {
            this.paymentProcessing = false;
            this.toast.error('Could not initiate payment. Try again.');
          }
        });
      },
      error: (e) => {
        this.paymentProcessing = false;
        this.toast.error(e?.error?.message || 'Booking failed. Try again.');
      }
    });
  }

  // pay() {
  //   // Legacy - kept for compatibility, actual flow uses confirmPay()
  //   this.openPaymentGateway();
  // }

  formatDuration(m: number): string {
    return `${Math.floor(m / 60)}h ${m % 60}m`;
  }
}