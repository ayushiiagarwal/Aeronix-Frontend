import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { FlightService } from '../../core/services/flight.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
  <div class="home">

    <!-- Hero -->
    <section class="hero">
      <div class="hero-bg">
        <div class="hero-gradient"></div>
        <div class="hero-grid"></div>
        <div class="floating-orb orb-1"></div>
        <div class="floating-orb orb-2"></div>
      </div>

      <div class="hero-content container">
        <h1 class="hero-title">
          Search<br><em>Your Flight</em>
        </h1>
        <p class="hero-sub">Search thousands of flights. Book with confidence.<br>Travel without limits.</p>

        <!-- Quick Search Card -->
        <div class="search-card">
          <div class="trip-toggle">
            <button [class.active]="tripType === 'ONE_WAY'" (click)="tripType='ONE_WAY'">One Way</button>
            <button [class.active]="tripType === 'ROUND_TRIP'" (click)="tripType='ROUND_TRIP'">Round Trip</button>
          </div>

          <div class="search-fields">
            <div class="search-field">
              <label>From</label>
              <input type="text" [(ngModel)]="origin" placeholder="City or airport code"
                class="search-input" (focus)="originFocus=true" (blur)="onBlur('origin')"
                (input)="searchAirports(origin, 'origin')">
              @if (originFocus && originSuggestions.length > 0) {
                <div class="suggestions">
                  @for (a of originSuggestions; track a.iataCode) {
                    <div class="suggestion" (mousedown)="selectAirport(a, 'origin')">
                      <span class="iata">{{ a.iataCode }}</span>
                      <span class="apt-name">{{ a.name }} · {{ a.city }}</span>
                    </div>
                  }
                </div>
              }
            </div>

            <button class="swap-btn" (click)="swap()" title="Swap airports">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 9h12M11 5l4 4-4 4M7 5L3 9l4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>

            <div class="search-field">
              <label>To</label>
              <input type="text" [(ngModel)]="destination" placeholder="City or airport code"
                class="search-input" (focus)="destFocus=true" (blur)="onBlur('dest')"
                (input)="searchAirports(destination, 'dest')">
              @if (destFocus && destSuggestions.length > 0) {
                <div class="suggestions">
                  @for (a of destSuggestions; track a.iataCode) {
                    <div class="suggestion" (mousedown)="selectAirport(a, 'dest')">
                      <span class="iata">{{ a.iataCode }}</span>
                      <span class="apt-name">{{ a.name }} · {{ a.city }}</span>
                    </div>
                  }
                </div>
              }
            </div>

            <div class="search-field">
              <label>Departure</label>
              <input type="date" [(ngModel)]="departureDate" [min]="today" class="search-input">
            </div>

            @if (tripType === 'ROUND_TRIP') {
              <div class="search-field">
                <label>Return</label>
                <input type="date" [(ngModel)]="returnDate" [min]="departureDate" class="search-input">
              </div>
            }

            <div class="search-field narrow">
              <label>Passengers</label>
              <select [(ngModel)]="passengers" class="search-input">
                @for (n of [1,2,3,4,5,6]; track n) {
                  <option [value]="n">{{ n }}</option>
                }
              </select>
            </div>

            <div class="search-field narrow">
              <label>Class</label>
              <select [(ngModel)]="seatClass" class="search-input">
                <option value="ECONOMY">Economy</option>
                <option value="BUSINESS">Business</option>
                <option value="FIRST">First Class</option>
              </select>
            </div>
          </div>

          <button class="btn btn-primary search-btn" (click)="search()">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="8" cy="8" r="5" stroke="currentColor" stroke-width="1.5"/>
              <path d="M12 12l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            Search Flights
          </button>
        </div>

        @if (!auth.isAuthenticated()) {
          <p class="guest-hint">
            Browsing as guest — <a routerLink="/auth/login">sign in</a> to book flights & manage trips
          </p>
        }
      </div>
    </section>

    <!-- Popular Routes -->
    <section class="routes-section section">
      <div class="container">
        <div class="section-header">
          <div class="gold-line"></div>
          <h2>Popular Routes</h2>
        </div>
        <div class="routes-grid stagger">
          @for (r of routes; track r.from) {
            <div class="route-card" (click)="searchRoute(r)">
              <div class="route-path">
                <span class="route-code">{{ r.from }}</span>
                <svg width="40" height="16" viewBox="0 0 40 16" fill="none">
                  <path d="M0 8h36M30 2l6 6-6 6" stroke="var(--gold)" stroke-width="1.2" stroke-linecap="round"/>
                </svg>
                <span class="route-code">{{ r.to }}</span>
              </div>
              <div class="route-info">
                <span>{{ r.fromCity }} → {{ r.toCity }}</span>
                <span class="route-price">from ₹{{ r.price | number }}</span>
              </div>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- CTA -->
    @if (!auth.isAuthenticated()) {
      <section class="cta-section">
        <div class="container">
          <div class="cta-card">
            <h2>Ready to Take Off?</h2>
            <p>Create an account to save your preferences, track bookings, and get exclusive deals.</p>
            <div class="cta-actions">
              <a routerLink="/auth/register" class="btn btn-primary">Create Free Account</a>
              <a routerLink="/flights" class="btn btn-ghost">Browse Flights</a>
            </div>
          </div>
        </div>
      </section>
    }

    <!-- Footer -->
    <footer class="footer">
      <div class="container">
        <div class="footer-top">
          <div class="footer-brand">
            <span class="logo-text">AERONIX</span>
            <p>Air travel, simplified.</p>
          </div>
          <div class="footer-links">
            <div>
              <a routerLink="/flights">Search Flights</a>
              <a routerLink="/auth/register">Join Aeronix</a>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <p>© 2026 Aeronix. All rights reserved.</p>
        </div>
      </div>
    </footer>
  </div>
  `,
  styles: [`
    .home { overflow-x: hidden; }

    /* Hero */
    .hero {
      position: relative; min-height: 100vh;
      display: flex; align-items: center;
      overflow: hidden;
    }
    .hero-bg { position: absolute; inset: 0; z-index: 0; }
    .hero-gradient {
      position: absolute; inset: 0;
      background: radial-gradient(ellipse 80% 80% at 50% 0%, rgba(201,168,76,0.08) 0%, transparent 60%),
                  radial-gradient(ellipse 60% 60% at 80% 50%, rgba(13,21,38,0.8) 0%, transparent 70%),
                  linear-gradient(180deg, var(--midnight) 0%, var(--navy) 100%);
    }
    .hero-grid {
      position: absolute; inset: 0;
      background-image:
        linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px);
      background-size: 60px 60px;
    }
    .floating-orb {
      position: absolute; border-radius: 50%;
      filter: blur(60px); opacity: 0.4;
      animation: float 8s ease-in-out infinite;
    }
    .orb-1 { width: 400px; height: 400px; background: rgba(201,168,76,0.12); top: 10%; left: 60%; }
    .orb-2 { width: 250px; height: 250px; background: rgba(13,21,38,0.8); top: 60%; left: 20%; animation-delay: -4s; }
    @keyframes float {
      0%, 100% { transform: translateY(0) scale(1); }
      50% { transform: translateY(-30px) scale(1.05); }
    }

    .hero-content {
      position: relative; z-index: 1;
      padding-top: 100px; padding-bottom: 80px;
    }
    .hero-eyebrow {
      display: flex; align-items: center; gap: 10px;
      font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase;
      color: var(--gold); margin-bottom: 24px;
      animation: fadeIn 0.6s ease forwards;
    }
    .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--gold); }
    .hero-title {
      font-size: clamp(3rem, 8vw, 6rem); font-weight: 300;
      line-height: 1.05; margin-bottom: 24px;
      animation: fadeIn 0.6s 0.1s ease both;
      em { font-style: italic; color: var(--gold); }
    }
    .hero-sub {
      font-size: 1.05rem; color: var(--white-dim); line-height: 1.7;
      margin-bottom: 48px; max-width: 480px;
      animation: fadeIn 0.6s 0.2s ease both;
    }

    /* Search Card */
    .search-card {
      background: rgba(13,21,38,0.7);
      backdrop-filter: blur(20px);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 28px;
      max-width: 900px;
      animation: fadeIn 0.6s 0.3s ease both;
      box-shadow: 0 24px 80px rgba(0,0,0,0.5), var(--shadow-gold);
    }
    .trip-toggle {
      display: flex; gap: 4px; margin-bottom: 24px;
      background: var(--midnight);
      border-radius: var(--radius);
      padding: 4px;
      width: fit-content;
      button {
        padding: 8px 20px;
        border: none; border-radius: calc(var(--radius) - 2px);
        background: transparent; cursor: pointer;
        font-family: var(--font-body); font-size: 13px; font-weight: 400;
        color: var(--white-dim); transition: var(--transition);
        letter-spacing: 0.04em;
        &.active { background: var(--gold); color: var(--midnight); font-weight: 500; }
      }
    }
    .search-fields {
      display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap;
      margin-bottom: 20px;
    }
    .search-field {
      flex: 1; min-width: 140px; position: relative;
      display: flex; flex-direction: column; gap: 6px;
      label {
        font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;
        color: var(--gold-dim); font-weight: 500;
      }
      &.narrow { flex: 0 0 120px; }
    }
    .search-input {
      width: 100%; padding: 12px 14px;
      background: var(--midnight);
      border: 1px solid var(--border-soft);
      border-radius: var(--radius);
      color: var(--white); font-family: var(--font-body);
      font-size: 14px; outline: none; transition: var(--transition);
      &:focus { border-color: var(--gold); box-shadow: 0 0 0 3px var(--gold-glow); }
      &::placeholder { color: rgba(245,240,232,0.3); }
    }
    select.search-input { appearance: none; cursor: pointer; }
    .swap-btn {
      flex: 0 0 40px; height: 44px;
      background: var(--white-faint); border: 1px solid var(--border-soft);
      border-radius: var(--radius); cursor: pointer;
      color: var(--gold); transition: var(--transition);
      display: flex; align-items: center; justify-content: center;
      &:hover { background: var(--gold-glow); border-color: var(--border); }
    }
    .suggestions {
      position: absolute; top: 100%; left: 0; right: 0; z-index: 50;
      background: var(--navy-light); border: 1px solid var(--border);
      border-radius: var(--radius); margin-top: 4px; overflow: hidden;
      box-shadow: var(--shadow);
    }
    .suggestion {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 14px; cursor: pointer; transition: var(--transition);
      &:hover { background: var(--white-faint); }
    }
    .iata { font-weight: 600; color: var(--gold); font-size: 13px; min-width: 36px; }
    .apt-name { font-size: 12px; color: var(--white-dim); }
    .search-btn { width: 100%; justify-content: center; padding: 14px; font-size: 14px; }
    .guest-hint {
      margin-top: 16px; font-size: 13px; color: var(--white-dim);
      animation: fadeIn 0.6s 0.4s ease both;
      a { color: var(--gold); }
    }


    /* Routes */
    .routes-section { background: var(--navy); }
    .routes-grid {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;
    }
    .route-card {
      background: var(--navy-light); border: 1px solid var(--border-soft);
      border-radius: var(--radius-lg); padding: 24px;
      cursor: pointer; transition: var(--transition);
      &:hover { border-color: var(--border); transform: translateY(-2px); box-shadow: var(--shadow-gold); }
    }
    .route-path {
      display: flex; align-items: center; gap: 12px; margin-bottom: 12px;
    }
    .route-code {
      font-family: var(--font-display); font-size: 1.5rem;
      font-weight: 500; color: var(--white);
    }
    .route-info {
      display: flex; justify-content: space-between; align-items: center;
      font-size: 12px; color: var(--white-dim);
    }
    .route-price { color: var(--gold); font-weight: 500; }

    /* CTA */
    .cta-section { padding: 80px 0; background: var(--midnight); }
    .cta-card {
      background: linear-gradient(135deg, var(--navy-mid) 0%, var(--navy) 100%);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg); padding: 64px;
      text-align: center;
      box-shadow: var(--shadow-gold);
      h2 { margin-bottom: 16px; }
      p { color: var(--white-dim); margin-bottom: 36px; font-size: 1rem; }
    }
    .cta-actions { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }

    /* Footer */
    .footer {
      background: var(--navy); border-top: 1px solid var(--border-soft);
      padding: 56px 0 32px;
    }
    .footer-top {
      display: flex; justify-content: space-between; gap: 40px; margin-bottom: 40px;
    }
    .footer-brand {
      .logo-text { font-family: var(--font-display); font-size: 1.4rem; letter-spacing: 0.15em; }
      p { color: var(--white-dim); font-size: 13px; margin-top: 8px; }
    }
    .footer-links {
      display: flex; gap: 60px;
      h5 { font-family: var(--font-display); font-size: 1rem; margin-bottom: 12px; color: var(--gold); }
      a { display: block; color: var(--white-dim); font-size: 13px; margin-bottom: 8px;
          text-decoration: none; transition: var(--transition);
          &:hover { color: var(--white); } }
    }
    .footer-bottom {
      border-top: 1px solid var(--border-soft); padding-top: 24px;
      p { color: rgba(245,240,232,0.3); font-size: 12px; }
    }

    @media (max-width: 900px) {
      .features-grid, .routes-grid { grid-template-columns: repeat(2, 1fr); }
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .stat-item:nth-child(2) { border-right: none; }
    }
    @media (max-width: 600px) {
      .search-fields { flex-direction: column; }
      .search-field.narrow { flex: 1; }
      .swap-btn { width: 100%; }
      .features-grid, .routes-grid { grid-template-columns: 1fr; }
      .cta-card { padding: 40px 24px; }
      .footer-top { flex-direction: column; }
      .footer-links { gap: 32px; }
    }
  `]
})
export class HomeComponent implements OnInit {
  auth = inject(AuthService);
  router = inject(Router);
  flightSvc = inject(FlightService);

  tripType: 'ONE_WAY' | 'ROUND_TRIP' = 'ONE_WAY';
  origin = ''; destination = '';
  departureDate = ''; returnDate = '';
  passengers = 1; seatClass = 'ECONOMY';
  originFocus = false; destFocus = false;
  originSuggestions: any[] = []; destSuggestions: any[] = [];
  today = new Date().toISOString().split('T')[0];

  routes = [
    { from: 'DEL', to: 'BOM', fromCity: 'Delhi', toCity: 'Mumbai', price: 3200 },
    { from: 'BLR', to: 'DEL', fromCity: 'Bengaluru', toCity: 'Delhi', price: 2800 },
    { from: 'MAA', to: 'BOM', fromCity: 'Chennai', toCity: 'Mumbai', price: 3500 },
    { from: 'HYD', to: 'BLR', fromCity: 'Hyderabad', toCity: 'Bengaluru', price: 1900 },
    { from: 'CCU', to: 'DEL', fromCity: 'Kolkata', toCity: 'Delhi', price: 4100 },
    { from: 'COK', to: 'BOM', fromCity: 'Kochi', toCity: 'Mumbai', price: 2600 }
  ];

  private searchTimeout: any;

  ngOnInit() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.departureDate = tomorrow.toISOString().split('T')[0];
  }

  searchAirports(query: string, field: 'origin' | 'dest') {
    clearTimeout(this.searchTimeout);
    if (query.length < 2) {
      if (field === 'origin') this.originSuggestions = [];
      else this.destSuggestions = [];
      return;
    }
    this.searchTimeout = setTimeout(() => {
      this.flightSvc.searchAirports(query).subscribe({
        next: (airports) => {
          if (field === 'origin') this.originSuggestions = airports;
          else this.destSuggestions = airports;
        },
        error: () => {
          if (field === 'origin') this.originSuggestions = [];
          else this.destSuggestions = [];
        }
      });
    }, 200);
  }

  selectAirport(a: any, field: 'origin' | 'dest') {
    if (field === 'origin') { this.origin = a.iataCode; this.originSuggestions = []; }
    else { this.destination = a.iataCode; this.destSuggestions = []; }
  }

  onBlur(field: string) {
    setTimeout(() => {
      if (field === 'origin') this.originFocus = false;
      else this.destFocus = false;
    }, 200);
  }

  swap() { [this.origin, this.destination] = [this.destination, this.origin]; }

  search() {
    if (!this.origin || !this.destination || !this.departureDate) return;
    const params: any = {
      origin: this.origin, destination: this.destination,
      date: this.departureDate, passengers: this.passengers,
      seatClass: this.seatClass, tripType: this.tripType
    };
    if (this.tripType === 'ROUND_TRIP' && this.returnDate) params.returnDate = this.returnDate;
    this.router.navigate(['/flights'], { queryParams: params });
  }

  searchRoute(r: any) {
    this.origin = r.from; this.destination = r.to;
    this.search();
  }
}
