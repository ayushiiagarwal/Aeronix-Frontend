import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FlightService } from '../../core/services/flight.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Flight } from '../../shared/models';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-flight-search',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
  <div class="page">
    <div class="search-bar-wrap">
      <div class="container">
        <div class="search-bar">
          <div class="sb-field">
            <label>From</label>
            <input type="text" [(ngModel)]="origin" class="sb-input" placeholder="Origin">
          </div>
          <button class="swap-btn" (click)="swap()">⇄</button>
          <div class="sb-field">
            <label>To</label>
            <input type="text" [(ngModel)]="destination" class="sb-input" placeholder="Destination">
          </div>
          <div class="sb-field">
            <label>Date</label>
            <input type="date" [(ngModel)]="date" [min]="today" class="sb-input">
          </div>
          <div class="sb-field narrow">
            <label>Pax</label>
            <select [(ngModel)]="passengers" class="sb-input">
              @for (n of [1,2,3,4,5,6]; track n) { <option [value]="n">{{ n }}</option> }
            </select>
          </div>
          <div class="sb-field narrow">
            <label>Class</label>
            <select [(ngModel)]="seatClass" class="sb-input">
              <option value="ECONOMY">Economy</option>
              <option value="BUSINESS">Business</option>
              <option value="FIRST">First</option>
            </select>
          </div>
          <button class="btn btn-primary" (click)="search()">Search</button>
        </div>
      </div>
    </div>

    <div class="container" style="padding-top: 40px; padding-bottom: 60px">
      <div class="results-layout">
        <!-- Filters Sidebar -->
        <aside class="filters-sidebar">
          <h4 class="filter-title">Filters</h4>

          <div class="filter-group">
            <label class="filter-label">Max Price (₹)</label>
            <input type="range" [(ngModel)]="maxPrice" min="1000" max="50000" step="500"
              class="range-input" (ngModelChange)="applyFilters()">
            <div class="range-value">₹{{ maxPrice | number }}</div>
          </div>

          <div class="filter-group">
            <label class="filter-label">Stops</label>
            <div class="check-opts">
              @for (s of stopOptions; track s.value) {
                <label class="check-opt">
                  <input type="checkbox" [(ngModel)]="s.checked" (change)="applyFilters()">
                  {{ s.label }}
                </label>
              }
            </div>
          </div>

          <div class="filter-group">
            <label class="filter-label">Sort By</label>
            <select [(ngModel)]="sortBy" (ngModelChange)="applyFilters()" class="sb-input">
              <option value="">Best Match</option>
              <option value="price">Price</option>
              <option value="duration">Duration</option>
              <option value="departure">Departure</option>
            </select>
          </div>

          <button class="btn btn-ghost w-full" style="margin-top:8px; justify-content:center; font-size:12px"
            (click)="resetFilters()">Reset Filters</button>
        </aside>

        <!-- Results -->
        <div class="results-main">
          @if (loading) {
            <div style="display:flex;align-items:center;gap:16px;padding:40px 0">
              <div class="spinner"></div>
              <span style="color:var(--white-dim)">Searching best fares...</span>
            </div>
          } @else if (searched && filtered.length === 0) {
            <div class="no-results">
              <div style="font-size:3rem;margin-bottom:16px">✈</div>
              <h3>No flights found</h3>
              <p>Try adjusting your filters or search for different dates.</p>
              @if (!auth.isAuthenticated()) {
                <p style="margin-top:12px"><a routerLink="/auth/login">Sign in</a> to access more routes</p>
              }
            </div>
          } @else if (!searched) {
            <div class="no-results">
              <div style="font-size:3rem;margin-bottom:16px">🔍</div>
              <h3>Find Your Flight</h3>
              <p>Enter your origin, destination and date above to search available flights.</p>
            </div>
          } @else {
            <div class="results-header">
              <span class="results-count">{{ filtered.length }} flight{{ filtered.length !== 1 ? 's' : '' }} found</span>
              <span style="color:var(--white-dim);font-size:13px">{{ origin }} → {{ destination }} · {{ date }}</span>
            </div>

            <div class="flight-list stagger">
              @for (f of filtered; track f.flightId) {
                <div class="flight-card card">
                  <div class="flight-main">
                    <div class="airline-info">
                      <div class="airline-code">{{ f.flightNumber }}</div>
                      <div class="airline-name">{{ getAirlineName(f.airlineId) }}</div>
                    </div>

                    <div class="flight-times">
                      <div class="time-block">
                        <div class="time">{{ f.departureTime | slice:11:16 }}</div>
                        <div class="airport-code">{{ f.originAirportCode }}</div>
                      </div>
                      <div class="flight-duration">
                        <div class="duration-line">
                          <div class="dur-dot"></div>
                          <div class="dur-track">
                            @if (f.stops > 0) {
                              <span class="stops-badge">{{ f.stops }} stop</span>
                            }
                          </div>
                          <div class="dur-dot"></div>
                        </div>
                        <div class="duration-text">{{ formatDuration(f.durationMinutes) }}</div>
                      </div>
                      <div class="time-block right">
                        <div class="time">{{ f.arrivalTime | slice:11:16 }}</div>
                        <div class="airport-code">{{ f.destinationAirportCode }}</div>
                      </div>
                    </div>

                    <div class="flight-badges">
                      <span class="badge badge-{{ getStatusClass(f.status) }}">{{ f.status }}</span>
                      @if (f.stops === 0) { <span class="badge badge-gold">Non-stop</span> }
                      <span class="badge badge-neutral">{{ f.availableSeats }} seats left</span>
                    </div>
                  </div>

                  <div class="flight-price-col">
                    <div class="price-class">{{ seatClass }}</div>
                    <div class="price">₹{{ getPrice(f) | number }}</div>
                    <div class="price-sub">per person</div>
                    <button class="btn btn-primary" style="width:100%; justify-content:center; margin-top:12px; padding:10px"
                      (click)="selectFlight(f)"
                      [disabled]="!canBookFlight()">
                      {{ getActionLabel() }}
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  </div>
  `,
  styles: [`
    .search-bar-wrap {
      background: var(--navy); border-bottom: 1px solid var(--border-soft);
      padding: 20px 0; position: sticky; top: 72px; z-index: 50;
    }
    .search-bar {
      display: flex; gap: 10px; align-items: flex-end; flex-wrap: wrap;
    }
    .sb-field {
      flex: 1; min-width: 100px; display: flex; flex-direction: column; gap: 4px;
      label { font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--gold-dim); }
      &.narrow { flex: 0 0 90px; }
    }
    .sb-input {
      padding: 9px 12px; background: var(--midnight);
      border: 1px solid var(--border-soft); border-radius: var(--radius);
      color: var(--white); font-family: var(--font-body); font-size: 13px;
      outline: none; width: 100%; transition: var(--transition);
      &:focus { border-color: var(--gold); }
    }
    select.sb-input { appearance: none; cursor: pointer; }
    .swap-btn {
      flex: 0 0 36px; height: 36px;
      background: var(--white-faint); border: 1px solid var(--border-soft);
      border-radius: var(--radius); color: var(--gold); cursor: pointer;
      font-size: 16px; transition: var(--transition);
      &:hover { background: var(--gold-glow); }
    }

    .results-layout { display: flex; gap: 28px; align-items: flex-start; }
    .filters-sidebar {
      flex: 0 0 220px; position: sticky; top: 150px;
      background: var(--navy-light); border: 1px solid var(--border-soft);
      border-radius: var(--radius-lg); padding: 24px;
    }
    .filter-title { font-family: var(--font-display); font-size: 1.1rem; margin-bottom: 20px; color: var(--gold); }
    .filter-group { margin-bottom: 20px; }
    .filter-label { font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--gold-dim); display: block; margin-bottom: 10px; }
    .range-input { width: 100%; accent-color: var(--gold); cursor: pointer; }
    .range-value { font-size: 13px; color: var(--white); margin-top: 6px; }
    .check-opts { display: flex; flex-direction: column; gap: 8px; }
    .check-opt {
      display: flex; align-items: center; gap: 8px;
      font-size: 13px; color: var(--white-dim); cursor: pointer;
      input { accent-color: var(--gold); }
    }

    .results-main { flex: 1; min-width: 0; }
    .results-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 20px;
    }
    .results-count { font-family: var(--font-display); font-size: 1.2rem; color: var(--white); }

    .flight-list { display: flex; flex-direction: column; gap: 16px; }
    .flight-card {
      display: flex; gap: 0; padding: 0;
      overflow: hidden; border-radius: var(--radius-lg);
    }
    .flight-main {
      flex: 1; padding: 24px;
      display: flex; gap: 24px; align-items: center; flex-wrap: wrap;
    }
    .airline-info { flex: 0 0 100px; }
    .airline-code { font-family: var(--font-display); font-size: 1rem; color: var(--gold); }
    .airline-name { font-size: 11px; color: var(--white-dim); margin-top: 2px; }

    .flight-times {
      flex: 1; display: flex; align-items: center; gap: 16px; min-width: 280px;
    }
    .time-block { text-align: center; }
    .time-block.right { text-align: right; }
    .time { font-family: var(--font-display); font-size: 1.6rem; color: var(--white); line-height: 1; }
    .airport-code { font-size: 11px; color: var(--white-dim); letter-spacing: 0.08em; margin-top: 4px; }

    .flight-duration { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; }
    .duration-line { display: flex; align-items: center; width: 100%; gap: 0; position: relative; }
    .dur-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--gold); flex-shrink: 0; }
    .dur-track {
      flex: 1; height: 1px; background: var(--border);
      display: flex; align-items: center; justify-content: center;
      position: relative;
    }
    .stops-badge {
      background: var(--navy); border: 1px solid var(--border);
      padding: 2px 8px; border-radius: 100px;
      font-size: 9px; color: var(--white-dim); white-space: nowrap;
    }
    .duration-text { font-size: 11px; color: var(--white-dim); }

    .flight-badges { display: flex; flex-wrap: wrap; gap: 6px; }

    .flight-price-col {
      flex: 0 0 160px; padding: 24px 20px;
      background: var(--midnight);
      border-left: 1px solid var(--border-soft);
      display: flex; flex-direction: column; align-items: flex-end; justify-content: center;
      text-align: right;
    }
    .price-class { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--gold-dim); }
    .price { font-family: var(--font-display); font-size: 1.8rem; color: var(--gold); line-height: 1.1; }
    .price-sub { font-size: 11px; color: var(--white-dim); }

    .no-results { text-align: center; padding: 80px 0; color: var(--white-dim);
      h3 { font-size: 1.6rem; color: var(--white); margin-bottom: 12px; }
      p { font-size: 14px; line-height: 1.6; }
      a { color: var(--gold); }
    }

    @media (max-width: 900px) {
      .results-layout { flex-direction: column; }
      .filters-sidebar { flex: none; width: 100%; position: static; }
    }
    @media (max-width: 600px) {
      .search-bar { flex-direction: column; }
      .sb-field.narrow { flex: 1; }
      .flight-card { flex-direction: column; }
      .flight-main { flex-direction: column; }
      .flight-price-col { flex: none; width: 100%; border-left: none; border-top: 1px solid var(--border-soft); text-align: left; }
    }
  `]
})
export class FlightSearchComponent implements OnInit {
  flightSvc = inject(FlightService);
  auth = inject(AuthService);
  router = inject(Router);
  route = inject(ActivatedRoute);
  toast = inject(ToastService);

  origin = ''; destination = ''; date = '';
  passengers = 1; seatClass = 'ECONOMY';
  loading = false; searched = false;
  today = new Date().toISOString().split('T')[0];
  flights: Flight[] = []; filtered: Flight[] = [];
  maxPrice = 50000; sortBy = '';
  stopOptions = [
    { label: 'Non-stop', value: 0, checked: false },
    { label: '1 Stop', value: 1, checked: false },
    { label: '2+ Stops', value: 2, checked: false }
  ];

  ngOnInit() {
    this.route.queryParams.subscribe(p => {
      if (p['origin']) {
        this.origin = p['origin']; this.destination = p['destination'];
        this.date = p['date']; this.passengers = p['passengers'] || 1;
        this.seatClass = p['seatClass'] || 'ECONOMY';
        this.search();
      }
    });
  }

  private async resolveAirportCode(input: string): Promise<string> {
    const value = input.trim();
    if (!value) return value;

    const direct = value.toUpperCase();
    if (/^[A-Z0-9]{3}$/.test(direct)) return direct;

    try {
      const airports = await firstValueFrom(this.flightSvc.searchAirports(value));
      if (!airports || airports.length === 0) return direct;

      const exactIata = airports.find(a => a.iataCode?.toUpperCase() === direct);
      if (exactIata) return exactIata.iataCode.toUpperCase();

      const exactCity = airports.find(a => a.city?.toLowerCase() === value.toLowerCase());
      if (exactCity) return exactCity.iataCode.toUpperCase();

      return airports[0].iataCode.toUpperCase();
    } catch {
      return direct;
    }
  }

  async search() {
    if (!this.origin || !this.destination || !this.date) {
      this.toast.error('Please fill in all search fields'); return;
    }

    const originCode = await this.resolveAirportCode(this.origin);
    const destinationCode = await this.resolveAirportCode(this.destination);

    this.loading = true; this.searched = false;
    this.flightSvc.searchFlights({
      origin: originCode, destination: destinationCode,
      date: this.date, passengers: this.passengers, seatClass: this.seatClass
    }).subscribe({
      next: (flights) => {
        this.flights = flights; this.applyFilters();
        this.loading = false; this.searched = true;
      },
      error: () => { this.loading = false; this.searched = true; this.flights = []; this.filtered = []; }
    });
  }

  applyFilters() {
    let res = [...this.flights];
    res = res.filter(f => this.getPrice(f) <= this.maxPrice);
    const checkedStops = this.stopOptions.filter(s => s.checked).map(s => s.value);
    if (checkedStops.length > 0) {
      res = res.filter(f => {
        if (checkedStops.includes(0) && f.stops === 0) return true;
        if (checkedStops.includes(1) && f.stops === 1) return true;
        if (checkedStops.includes(2) && f.stops >= 2) return true;
        return false;
      });
    }
    if (this.sortBy === 'price') res.sort((a, b) => this.getPrice(a) - this.getPrice(b));
    else if (this.sortBy === 'duration') res.sort((a, b) => a.durationMinutes - b.durationMinutes);
    else if (this.sortBy === 'departure') res.sort((a, b) => a.departureTime.localeCompare(b.departureTime));
    this.filtered = res;
  }

  resetFilters() {
    this.maxPrice = 50000; this.sortBy = '';
    this.stopOptions.forEach(s => s.checked = false);
    this.applyFilters();
  }

  swap() { [this.origin, this.destination] = [this.destination, this.origin]; }

  getPrice(f: Flight): number {
    if (this.seatClass === 'BUSINESS') return f.businessPrice || f.basePrice;
    if (this.seatClass === 'FIRST') return f.firstClassPrice || f.basePrice;
    return f.economyPrice || f.basePrice;
  }

  formatDuration(minutes: number): string {
    const h = Math.floor(minutes / 60); const m = minutes % 60;
    return `${h}h ${m}m`;
  }

  getAirlineName(id: number): string {
    const names: Record<number, string> = { 1: 'IndiGo', 2: 'Air India', 3: 'SpiceJet', 4: 'Vistara', 5: 'GoAir' };
    return names[id] || 'Airline ' + id;
  }

  getStatusClass(status: string): string {
    if (status === 'ON_TIME' || status === 'ARRIVED') return 'success';
    if (status === 'CANCELLED') return 'error';
    if (status === 'DELAYED') return 'error';
    return 'gold';
  }

  selectFlight(f: Flight) {
    if (!this.auth.isAuthenticated()) {
      this.toast.info('Please sign in to book a flight');
      this.router.navigate(['/auth/login']);
      return;
    }
    if (this.auth.getRole() !== 'PASSENGER') {
      this.toast.error('Only passengers can book flights');
      return;
    }
    this.router.navigate(['/booking'], {
      queryParams: { flightId: f.flightId, seatClass: this.seatClass, passengers: this.passengers }
    });
  }

  getActionLabel(): string {
    if (!this.auth.isAuthenticated()) return 'Select';
    if (this.auth.getRole() !== 'PASSENGER') return 'View Only';
    return 'Book Now';
  }

  canBookFlight(): boolean {
    return !this.auth.isAuthenticated() || this.auth.getRole() === 'PASSENGER';
  }
}
