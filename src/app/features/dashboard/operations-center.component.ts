import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { AirlineService } from '../../core/services/airline.service';
import { AuthService } from '../../core/services/auth.service';
import { BookingService } from '../../core/services/booking.service';
import { FlightService } from '../../core/services/flight.service';
import { PassengerService } from '../../core/services/passenger.service';
import { PaymentService } from '../../core/services/payment.service';
import { SeatService } from '../../core/services/seat.service';
import { ToastService } from '../../core/services/toast.service';
import { Airline, Airport, Booking, Flight, Payment, SeatMapResponse, User } from '../../shared/models';

type OpsTab = 'flights' | 'seats' | 'catalog' | 'bookings' | 'users';

@Component({
  selector: 'app-operations-center',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
  <div class="ops-shell">
    <div class="dash-header">
      <div>
        <h2>{{ isAdmin ? 'Admin dashboard' : 'Airline staff dashboard' }}</h2>
        <p class="text-dim" style="margin-top:6px">
          Manage flights, seat maps, airports, airlines, and booking operations
        </p>
      </div>
      <div class="dash-actions">
        <a routerLink="/flights" class="btn btn-primary">Search Flights</a>
        <a routerLink="/pnr" class="btn btn-ghost">PNR Lookup</a>
      </div>
    </div>

    <div class="dash-stats stagger">
      <div class="stat-card card">
        <div class="sc-value">{{ flights.length }}</div>
        <div class="sc-label">Total Flights</div>
      </div>
      <div class="stat-card card">
        <div class="sc-value">{{ activeFlights }}</div>
        <div class="sc-label">Active Flights</div>
      </div>
      <div class="stat-card card">
        <div class="sc-value">{{ totalAvailableSeats }}</div>
        <div class="sc-label">Seats Available</div>
      </div>
      <div class="stat-card card">
        <div class="sc-value">{{ routeCount }}</div>
        <div class="sc-label">Routes</div>
      </div>
    </div>

    @if (isAdmin) {
      <div class="dash-stats stagger" style="margin-top:-8px">
        <div class="stat-card card">
          <div class="sc-value">Rs {{ analytics.totalRevenue | number }}</div>
          <div class="sc-label">Platform Revenue</div>
        </div>
        <div class="stat-card card">
          <div class="sc-value">{{ analytics.totalTransactions }}</div>
          <div class="sc-label">Transactions</div>
        </div>
        <div class="stat-card card">
          <div class="sc-value">{{ users.length }}</div>
          <div class="sc-label">Users</div>
        </div>
        <div class="stat-card card">
          <div class="sc-value">{{ bookings.length }}</div>
          <div class="sc-label">Bookings</div>
        </div>
      </div>
    }

    <div class="booking-tabs">
      @for (tab of tabs; track tab.value) {
        <button class="tab-btn" [class.active]="activeTab === tab.value" (click)="activeTab = tab.value">
          {{ tab.label }}
        </button>
      }
    </div>

    @if (loading) {
      <div style="display:flex;align-items:center;gap:16px;padding:40px 0">
        <div class="spinner"></div><span class="text-dim">Loading operations data...</span>
      </div>
    } @else {
      @if (activeTab === 'flights') {
        <div class="panel-grid">
          <form class="card panel" (ngSubmit)="saveFlight()">
            <div class="section-head">
              <div>
                <div class="eyebrow text-gold">Flight management</div>
                <h3>{{ editingFlightId ? 'Edit flight' : 'Create flight' }}</h3>
              </div>
              <span class="section-meta">{{ editingFlightId ? 'Editing #' + editingFlightId : 'New flight row' }}</span>
            </div>
            <div class="form-grid">
              <label class="form-group">
                <span>Flight Number</span>
                <input class="input" name="flightNumber" [(ngModel)]="flightForm.flightNumber" placeholder="AI301">
              </label>
              <label class="form-group">
                <span>Airline ID</span>
                <input class="input" type="number" name="airlineId" [(ngModel)]="flightForm.airlineId" placeholder="1">
              </label>
              <label class="form-group">
                <span>Origin</span>
                <input class="input" name="originAirportCode" [(ngModel)]="flightForm.originAirportCode" placeholder="DEL">
              </label>
              <label class="form-group">
                <span>Destination</span>
                <input class="input" name="destinationAirportCode" [(ngModel)]="flightForm.destinationAirportCode" placeholder="MUM">
              </label>
              <label class="form-group">
                <span>Departure</span>
                <input class="input" type="datetime-local" name="departureTime" [(ngModel)]="flightForm.departureTime">
              </label>
              <label class="form-group">
                <span>Arrival</span>
                <input class="input" type="datetime-local" name="arrivalTime" [(ngModel)]="flightForm.arrivalTime">
              </label>
              <label class="form-group">
                <span>Total Seats</span>
                <input class="input" type="number" name="totalSeats" [(ngModel)]="flightForm.totalSeats">
              </label>
              <label class="form-group">
                <span>Base Price</span>
                <input class="input" type="number" name="basePrice" [(ngModel)]="flightForm.basePrice">
              </label>
              <label class="form-group">
                <span>Economy Price</span>
                <input class="input" type="number" name="economyPrice" [(ngModel)]="flightForm.economyPrice">
              </label>
              <label class="form-group">
                <span>Business Price</span>
                <input class="input" type="number" name="businessPrice" [(ngModel)]="flightForm.businessPrice">
              </label>
              <label class="form-group">
                <span>First Class Price</span>
                <input class="input" type="number" name="firstClassPrice" [(ngModel)]="flightForm.firstClassPrice">
              </label>
              <label class="form-group">
                <span>Aircraft Type</span>
                <input class="input" name="aircraftType" [(ngModel)]="flightForm.aircraftType" placeholder="A320neo">
              </label>
              <label class="form-group">
                <span>Stops</span>
                <input class="input" type="number" name="stops" [(ngModel)]="flightForm.stops">
              </label>
            </div>
            <div class="form-actions">
              <button class="btn btn-primary" type="submit">{{ editingFlightId ? 'Update Flight' : 'Create Flight' }}</button>
              <button class="btn btn-ghost" type="button" (click)="resetFlightForm()">Reset</button>
            </div>
          </form>

          <div class="card panel">
            <div class="section-head">
              <div>
                <div class="eyebrow text-gold">Flight inventory</div>
                <h3>Existing flight rows</h3>
              </div>
              <span class="section-meta">{{ flights.length }} loaded</span>
            </div>
            @if (flights.length === 0) {
              <div class="empty-state compact">
                <h3>No flights yet</h3>
                <p>The demo seeder will populate flights on startup once backend services are restarted.</p>
              </div>
            } @else {
              <div class="inventory-list">
                @for (flight of flights; track flight.flightId) {
                  <div class="inventory-card">
                    <div>
                      <div class="inv-number">{{ flight.flightNumber }}</div>
                      <div class="inv-route">{{ flight.originAirportCode }} → {{ flight.destinationAirportCode }}</div>
                      <div class="inv-meta">{{ flight.departureTime | slice:0:16 }} | {{ flight.aircraftType || 'Aircraft' }}</div>
                    </div>
                    <div class="inv-actions">
                      <span class="badge badge-{{ getStatusBadge(flight.status) }}">{{ flight.status }}</span>
                      <span class="badge badge-neutral">{{ flight.availableSeats }} seats</span>
                      <button class="btn btn-ghost" type="button" (click)="startEditFlight(flight)">Edit</button>
                      <button class="btn btn-outline" type="button" (click)="setFlightStatus(flight.flightId, 'DELAYED')">Delay</button>
                      <button class="btn btn-ghost" type="button" style="color:var(--error)" (click)="deleteFlight(flight.flightId)">Delete</button>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }

      @if (activeTab === 'seats') {
        <div class="panel-grid">
          <form class="card panel" (ngSubmit)="generateSeats()">
            <div class="section-head">
              <div>
                <div class="eyebrow text-gold">Seat management</div>
                <h3>Generate or rebuild seat map</h3>
              </div>
              <span class="section-meta">Uses the real seat-service API</span>
            </div>
            <div class="form-grid">
              <label class="form-group">
                <span>Flight ID</span>
                <input class="input" type="number" name="seatFlightId" [(ngModel)]="seatForm.flightId" (ngModelChange)="loadSeatMap()">
              </label>
              <label class="form-group">
                <span>First Class Rows</span>
                <input class="input" type="number" name="firstClassRows" [(ngModel)]="seatForm.firstClassRows">
              </label>
              <label class="form-group">
                <span>Business Rows</span>
                <input class="input" type="number" name="businessRows" [(ngModel)]="seatForm.businessRows">
              </label>
              <label class="form-group">
                <span>Economy Rows</span>
                <input class="input" type="number" name="economyRows" [(ngModel)]="seatForm.economyRows">
              </label>
              <label class="form-group">
                <span>Seats / Row</span>
                <input class="input" type="number" name="seatsPerRow" [(ngModel)]="seatForm.seatsPerRow">
              </label>
            </div>
            <div class="form-actions">
              <button class="btn btn-primary" type="submit">Generate Seats</button>
              <button class="btn btn-ghost" type="button" (click)="deleteSeats()">Delete Seats</button>
            </div>
          </form>

          <div class="card panel">
            <div class="section-head">
              <div>
                <div class="eyebrow text-gold">Seat map</div>
                <h3>Current seat layout</h3>
              </div>
              <span class="section-meta" *ngIf="seatMap">{{ seatMap.totalAvailable }} available / {{ seatMap.totalSeats }} total</span>
            </div>
            @if (!seatMap) {
              <div class="empty-state compact">
                <h3>No seat map loaded</h3>
                <p>Enter a flight ID to inspect the live seat map or create one with the generator.</p>
              </div>
            } @else {
              <div class="seat-map-summary">
                <div class="summary-chip">Economy: {{ seatCount('ECONOMY') }}</div>
                <div class="summary-chip">Business: {{ seatCount('BUSINESS') }}</div>
                <div class="summary-chip">First: {{ seatCount('FIRST') }}</div>
              </div>
              <div class="mini-grid">
                @for (seat of firstSeats; track seat.seatId) {
                  <div class="seat-pill">{{ seat.seatNumber }} · {{ seat.status }}</div>
                }
              </div>
            }
          </div>
        </div>
      }

      @if (activeTab === 'catalog') {
        <div class="panel-grid">
          <form class="card panel" (ngSubmit)="saveAirline()">
            <div class="section-head">
              <div>
                <div class="eyebrow text-gold">Airlines</div>
                <h3>{{ airlineForm.airlineId ? 'Edit airline' : 'Create airline' }}</h3>
              </div>
              <span class="section-meta">Admin only</span>
            </div>
            <div class="form-grid">
              <label class="form-group"><span>Name</span><input class="input" name="airlineName" [(ngModel)]="airlineForm.name"></label>
              <label class="form-group"><span>IATA</span><input class="input" name="airlineIata" [(ngModel)]="airlineForm.iataCode"></label>
              <label class="form-group"><span>ICAO</span><input class="input" name="airlineIcao" [(ngModel)]="airlineForm.icaoCode"></label>
              <label class="form-group"><span>Country</span><input class="input" name="airlineCountry" [(ngModel)]="airlineForm.country"></label>
              <label class="form-group"><span>Contact Email</span><input class="input" name="airlineEmail" [(ngModel)]="airlineForm.contactEmail"></label>
              <label class="form-group"><span>Website</span><input class="input" name="airlineWebsite" [(ngModel)]="airlineForm.website"></label>
            </div>
            <div class="form-actions">
              <button class="btn btn-primary" type="submit">Save Airline</button>
              <button class="btn btn-ghost" type="button" (click)="resetAirlineForm()">Reset</button>
            </div>
          </form>

          <form class="card panel" (ngSubmit)="saveAirport()">
            <div class="section-head">
              <div>
                <div class="eyebrow text-gold">Airports</div>
                <h3>{{ airportForm.airportId ? 'Edit airport' : 'Create airport' }}</h3>
              </div>
              <span class="section-meta">Admin only</span>
            </div>
            <div class="form-grid">
              <label class="form-group"><span>Name</span><input class="input" name="airportName" [(ngModel)]="airportForm.name"></label>
              <label class="form-group"><span>IATA</span><input class="input" name="airportIata" [(ngModel)]="airportForm.iataCode"></label>
              <label class="form-group"><span>ICAO</span><input class="input" name="airportIcao" [(ngModel)]="airportForm.icaoCode"></label>
              <label class="form-group"><span>City</span><input class="input" name="airportCity" [(ngModel)]="airportForm.city"></label>
              <label class="form-group"><span>Country</span><input class="input" name="airportCountry" [(ngModel)]="airportForm.country"></label>
              <label class="form-group"><span>Timezone</span><input class="input" name="airportTimezone" [(ngModel)]="airportForm.timezone"></label>
            </div>
            <div class="form-actions">
              <button class="btn btn-primary" type="submit">Save Airport</button>
              <button class="btn btn-ghost" type="button" (click)="resetAirportForm()">Reset</button>
            </div>
          </form>
        </div>

        <div class="panel-grid" style="margin-top:16px">
          <div class="card panel">
            <div class="section-head">
              <div>
                <div class="eyebrow text-gold">Airlines list</div>
                <h3>Catalog overview</h3>
              </div>
              <span class="section-meta">{{ airlines.length }} airlines</span>
            </div>
            <div class="catalog-list">
              @for (airline of airlines; track airline.airlineId) {
                <div class="catalog-row">
                  <div>
                    <div class="catalog-title">{{ airline.name }} <span class="text-gold">({{ airline.iataCode }})</span></div>
                    <div class="catalog-sub">{{ airline.country }} | {{ airline.contactEmail || 'No contact email' }}</div>
                  </div>
                  <div class="inv-actions">
                    <span class="badge badge-{{ airline.isActive ? 'success' : 'error' }}">{{ airline.isActive ? 'Active' : 'Inactive' }}</span>
                    <button class="btn btn-ghost" type="button" (click)="editAirline(airline)">Edit</button>
                    <button class="btn btn-outline" type="button" (click)="toggleAirline(airline)">{{ airline.isActive ? 'Deactivate' : 'Activate' }}</button>
                  </div>
                </div>
              }
            </div>
          </div>

          <div class="card panel">
            <div class="section-head">
              <div>
                <div class="eyebrow text-gold">Airports list</div>
                <h3>Route network</h3>
              </div>
              <span class="section-meta">{{ airports.length }} airports</span>
            </div>
            <div class="catalog-list">
              @for (airport of airports; track airport.airportId) {
                <div class="catalog-row">
                  <div>
                    <div class="catalog-title">{{ airport.city }} <span class="text-gold">({{ airport.iataCode }})</span></div>
                    <div class="catalog-sub">{{ airport.name }} | {{ airport.country }}</div>
                  </div>
                  <div class="inv-actions">
                    <span class="badge badge-{{ airport.isActive ? 'success' : 'error' }}">{{ airport.isActive ? 'Active' : 'Inactive' }}</span>
                    <button class="btn btn-ghost" type="button" (click)="editAirport(airport)">Edit</button>
                    <button class="btn btn-outline" type="button" (click)="toggleAirport(airport)">{{ airport.isActive ? 'Deactivate' : 'Activate' }}</button>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      }

      @if (activeTab === 'bookings') {
        <div class="panel-grid">
          <div class="card panel">
            <div class="section-head">
              <div>
                <div class="eyebrow text-gold">Flight ops</div>
                <h3>Bookings, revenue, and passenger manifest</h3>
              </div>
              <span class="section-meta">{{ isAdmin ? 'Admin view' : 'Staff view' }}</span>
            </div>
            <div class="form-grid">
              <label class="form-group">
                <span>Flight ID</span>
                <input class="input" type="number" name="opsFlightId" [(ngModel)]="opsFlightId">
              </label>
            </div>
            <div class="form-actions">
              <button class="btn btn-primary" type="button" (click)="loadFlightOperations()">Load Flight Ops</button>
              <button class="btn btn-ghost" type="button" (click)="loadAdminData()">Refresh All</button>
            </div>
            @if (flightRevenue) {
              <div class="seat-map-summary" style="margin-top:18px">
                <div class="summary-chip">Revenue: Rs {{ flightRevenue.totalRevenue | number }}</div>
                <div class="summary-chip">Confirmed: {{ flightRevenue.confirmedBookings }}</div>
              </div>
            }
            @if (bookings.length > 0) {
              <div class="catalog-list" style="margin-top:18px">
                @for (booking of bookings.slice(0, 8); track booking.bookingId) {
                  <div class="catalog-row">
                    <div>
                      <div class="catalog-title">{{ booking.pnrCode }}</div>
                      <div class="catalog-sub">{{ booking.tripType }} | {{ booking.passengerCount }} pax | Rs {{ booking.totalFare | number }}</div>
                    </div>
                    <span class="badge badge-{{ getBookingBadge(booking.status) }}">{{ booking.status }}</span>
                  </div>
                }
              </div>
            }
          </div>

          <div class="card panel">
            <div class="section-head">
              <div>
                <div class="eyebrow text-gold">Manifest</div>
                <h3>Passenger manifest for selected flight</h3>
              </div>
              <span class="section-meta">{{ manifest.length }} passengers</span>
            </div>
            @if (manifest.length === 0) {
              <div class="empty-state compact">
                <h3>No manifest loaded</h3>
                <p>Enter a flight ID and load flight operations to inspect the manifest.</p>
              </div>
            } @else {
              <div class="catalog-list">
                @for (entry of manifest; track entry.passengerId) {
                  <div class="catalog-row">
                    <div>
                      <div class="catalog-title">{{ entry.fullName }}</div>
                      <div class="catalog-sub">{{ entry.pnrCode }} | {{ entry.seatNumber || 'No seat assigned' }} | {{ entry.passengerType }}</div>
                    </div>
                    <span class="badge badge-{{ entry.checkedIn ? 'success' : 'neutral' }}">{{ entry.checkedIn ? 'Checked In' : 'Not Checked In' }}</span>
                  </div>
                }
              </div>
            }
          </div>
        </div>

        @if (isAdmin) {
          <div class="panel-grid" style="margin-top:16px">
            <div class="card panel">
              <div class="section-head">
                <div>
                  <div class="eyebrow text-gold">Bookings</div>
                  <h3>Latest bookings across platform</h3>
                </div>
                <span class="section-meta">{{ bookings.length }} bookings</span>
              </div>
              <div class="catalog-list">
                @for (booking of bookings.slice(0, 8); track booking.bookingId) {
                  <div class="catalog-row">
                    <div>
                      <div class="catalog-title">{{ booking.pnrCode }} <span class="text-gold">Flight #{{ booking.flightId }}</span></div>
                      <div class="catalog-sub">{{ booking.tripType }} | {{ booking.passengerCount }} pax | {{ booking.bookedAt | slice:0:10 }}</div>
                    </div>
                    <div class="inv-actions">
                      <span class="badge badge-{{ getBookingBadge(booking.status) }}">{{ booking.status }}</span>
                      <span class="badge badge-neutral">Rs {{ booking.totalFare | number }}</span>
                    </div>
                  </div>
                }
              </div>
            </div>

            <div class="card panel">
              <div class="section-head">
                <div>
                  <div class="eyebrow text-gold">Payments</div>
                  <h3>Platform payment summary</h3>
                </div>
                <span class="section-meta">Admin analytics</span>
              </div>
              <div class="seat-map-summary">
                <div class="summary-chip">Total Revenue: Rs {{ analytics.totalRevenue | number }}</div>
                <div class="summary-chip">Transactions: {{ analytics.totalTransactions }}</div>
              </div>
              <div class="catalog-list" style="margin-top:16px">
                @for (payment of payments.slice(0, 6); track payment.paymentId) {
                  <div class="catalog-row">
                    <div>
                      <div class="catalog-title">{{ payment.paymentId }}</div>
                      <div class="catalog-sub">{{ payment.bookingId }} | Rs {{ payment.amount | number }} | {{ payment.paymentMode }}</div>
                    </div>
                    <span class="badge badge-{{ getPaymentBadge(payment.status) }}">{{ payment.status }}</span>
                  </div>
                }
              </div>
            </div>
          </div>
        }
      }

      @if (activeTab === 'users' && isAdmin) {
        <div class="card panel">
          <div class="section-head">
            <div>
              <div class="eyebrow text-gold">User management</div>
              <h3>Passenger, staff, and admin accounts</h3>
            </div>
            <span class="section-meta">{{ users.length }} users</span>
          </div>
          <div class="catalog-list">
            @for (user of users; track user.userId) {
              <div class="catalog-row">
                <div>
                  <div class="catalog-title">{{ user.fullName }}</div>
                  <div class="catalog-sub">{{ user.email }} | {{ user.role }} | {{ user.phone || 'No phone' }}</div>
                </div>
                <div class="inv-actions">
                  <span class="badge badge-{{ user.isActive ? 'success' : 'error' }}">{{ user.isActive ? 'Active' : 'Inactive' }}</span>
                  @if (user.isActive) {
                    <button class="btn btn-outline" type="button" (click)="deactivateUser(user)">Deactivate</button>
                  } @else {
                    <button class="btn btn-primary" type="button" (click)="reactivateUser(user)">Reactivate</button>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      }
    }
  </div>
  `,
  styles: [`
    .ops-shell { display: block; }
    .dash-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: 20px; margin-bottom: 36px; flex-wrap: wrap;
      h2 { font-size: 2.2rem; }
    }
    .dash-actions { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
    .eyebrow {
      font-size: 11px; text-transform: uppercase; letter-spacing: 0.14em;
      margin-bottom: 6px;
    }
    .dash-stats {
      display: grid; grid-template-columns: repeat(4, 1fr);
      gap: 16px; margin-bottom: 24px;
    }
    .stat-card { padding: 24px; text-align: center; }
    .sc-value { font-family: var(--font-display); font-size: 2rem; line-height: 1; }
    .sc-label {
      font-size: 12px; color: var(--white-dim); margin-top: 6px;
      text-transform: uppercase; letter-spacing: 0.08em;
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
    .panel-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
      align-items: start;
    }
    .panel { padding: 20px; }
    .section-head {
      display: flex; justify-content: space-between; align-items: end;
      gap: 16px; margin: 0 0 18px;
    }
    .section-head h3 {
      font-family: var(--font-display);
      font-size: 1.2rem;
      color: var(--white);
      margin: 0;
    }
    .section-meta {
      font-size: 12px;
      color: var(--white-dim);
      letter-spacing: 0.06em;
    }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
      color: var(--white-dim);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .input {
      width: 100%;
      background: var(--midnight);
      color: var(--white);
      border: 1px solid var(--border-soft);
      border-radius: var(--radius);
      padding: 12px 14px;
      font-family: var(--font-body);
    }
    .form-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-top: 16px;
    }
    .inventory-list,
    .catalog-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .inventory-card,
    .catalog-row {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      padding: 14px 16px;
      border-radius: var(--radius);
      background: rgba(255,255,255,0.02);
      border: 1px solid var(--border-soft);
      align-items: center;
      flex-wrap: wrap;
    }
    .inv-number, .catalog-title {
      font-family: var(--font-display);
      color: var(--white);
      font-size: 1rem;
      letter-spacing: 0.04em;
    }
    .inv-route, .catalog-sub, .inv-meta {
      color: var(--white-dim);
      font-size: 12px;
      margin-top: 4px;
    }
    .inv-actions {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
      justify-content: flex-end;
    }
    .seat-map-summary {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 4px;
    }
    .summary-chip {
      padding: 8px 12px;
      border-radius: 999px;
      background: rgba(201,168,76,0.12);
      color: var(--white);
      border: 1px solid rgba(201,168,76,0.2);
      font-size: 12px;
    }
    .mini-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 16px;
    }
    .seat-pill {
      padding: 8px 10px;
      border-radius: 999px;
      background: var(--midnight);
      border: 1px solid var(--border-soft);
      color: var(--white-dim);
      font-size: 12px;
    }
    .empty-state {
      text-align: center; padding: 50px 0; color: var(--white-dim);
      h3 { font-size: 1.3rem; color: var(--white); margin-bottom: 8px; }
      p { font-size: 14px; line-height: 1.6; }
    }
    .empty-state.compact { padding: 24px 0; }
    @media (max-width: 900px) {
      .dash-stats, .panel-grid, .form-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class OperationsCenterComponent implements OnInit {
  @Input() isAdmin = false;

  auth = inject(AuthService);
  flightSvc = inject(FlightService);
  seatSvc = inject(SeatService);
  airlineSvc = inject(AirlineService);
  bookingSvc = inject(BookingService);
  passengerSvc = inject(PassengerService);
  paymentSvc = inject(PaymentService);
  toast = inject(ToastService);
  router = inject(Router);

  activeTab: OpsTab = 'flights';
  loading = false;

  flights: Flight[] = [];
  airlines: Airline[] = [];
  airports: Airport[] = [];
  users: User[] = [];
  bookings: Booking[] = [];
  payments: Payment[] = [];
  manifest: any[] = [];
  seatMap: SeatMapResponse | null = null;
  flightRevenue: { flightId: number; totalRevenue: number; confirmedBookings: number } | null = null;
  analytics = { totalRevenue: 0, totalTransactions: 0 };

  opsFlightId = 0;
  editingFlightId: number | null = null;

  flightForm = this.emptyFlightForm();
  seatForm = { flightId: 0, firstClassRows: 1, businessRows: 2, economyRows: 27, seatsPerRow: 6 };
  airlineForm: any = this.emptyAirlineForm();
  airportForm: any = this.emptyAirportForm();

  tabs: { label: string; value: OpsTab; adminOnly?: boolean }[] = [
    { label: 'Flights', value: 'flights' },
    { label: 'Seats', value: 'seats' },
    { label: 'Catalog', value: 'catalog', adminOnly: true },
    { label: 'Bookings', value: 'bookings' },
    { label: 'Users', value: 'users', adminOnly: true }
  ];

  get visibleTabs() {
    return this.tabs.filter(t => !t.adminOnly || this.isAdmin);
  }

  get activeFlights(): number {
    return this.flights.filter(f => f.status !== 'CANCELLED').length;
  }

  get totalAvailableSeats(): number {
    return this.flights.reduce((sum, f) => sum + (f.availableSeats || 0), 0);
  }

  get routeCount(): number {
    return new Set(this.flights.map(f => `${f.originAirportCode}-${f.destinationAirportCode}`)).size;
  }

  get firstSeats(): any[] {
    return this.seatMap ? [
      ...(this.seatMap.seatsByClass['FIRST'] || []).slice(0, 8),
      ...(this.seatMap.seatsByClass['BUSINESS'] || []).slice(0, 8),
      ...(this.seatMap.seatsByClass['ECONOMY'] || []).slice(0, 8)
    ] : [];
  }

  getPaymentBadge(status: string): string {
    if (status === 'SUCCESS' || status === 'COMPLETED') return 'success';
    if (status === 'FAILED' || status === 'REFUNDED') return 'error';
    return 'gold';
  }

  seatCount(seatClass: string): number {
    return this.seatMap?.seatsByClass?.[seatClass]?.length ?? 0;
  }

  ngOnInit() {
    this.loadAdminData();
    this.tabs = this.visibleTabs;
    if (!this.isAdmin) {
      this.activeTab = 'flights';
    }
  }

  loadAdminData() {
    this.loading = true;
    forkJoin({
      flights: this.flightSvc.getAllFlights().pipe(catchError(() => of([] as Flight[]))),
      airlines: this.isAdmin
        ? this.airlineSvc.getAllAirlines().pipe(catchError(() => of([] as Airline[])))
        : this.airlineSvc.getAirlines().pipe(catchError(() => of([] as Airline[]))),
      airports: this.isAdmin
        ? this.airlineSvc.getAllAirports().pipe(catchError(() => of([] as Airport[])))
        : this.airlineSvc.getAirports().pipe(catchError(() => of([] as Airport[]))),
      users: this.isAdmin ? this.auth.getAllUsers().pipe(catchError(() => of([] as User[]))) : of([] as User[]),
      bookings: this.isAdmin ? this.bookingSvc.getAllBookings().pipe(catchError(() => of([] as Booking[]))) : of([] as Booking[]),
      payments: this.isAdmin ? this.paymentSvc.getAllPayments().pipe(catchError(() => of([] as Payment[]))) : of([] as Payment[]),
      analytics: this.isAdmin
        ? this.paymentSvc.getAnalytics().pipe(catchError(() => of({ totalRevenue: 0, totalTransactions: 0 })))
        : of({ totalRevenue: 0, totalTransactions: 0 })
    }).subscribe({
      next: ({ flights, airlines, airports, users, bookings, payments, analytics }) => {
        this.flights = flights;
        this.airlines = airlines;
        this.airports = airports;
        this.users = users;
        this.bookings = bookings;
        this.payments = payments;
        this.analytics = analytics;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.error('Could not load operations data');
      }
    });
  }

  saveFlight() {
    const payload = this.buildFlightPayload();
    const action$ = this.editingFlightId
      ? this.flightSvc.updateFlight(this.editingFlightId, payload)
      : this.flightSvc.createFlight(payload);

    action$.subscribe({
      next: () => {
        this.toast.success(this.editingFlightId ? 'Flight updated' : 'Flight created');
        this.resetFlightForm();
        this.loadAdminData();
      },
      error: (err) => this.toast.error(this.extractError(err, 'Could not save flight'))
    });
  }

  startEditFlight(flight: Flight) {
    this.editingFlightId = flight.flightId;
    this.flightForm = {
      flightNumber: flight.flightNumber,
      airlineId: flight.airlineId,
      originAirportCode: flight.originAirportCode,
      destinationAirportCode: flight.destinationAirportCode,
      departureTime: flight.departureTime.slice(0, 16),
      arrivalTime: flight.arrivalTime.slice(0, 16),
      totalSeats: flight.totalSeats,
      basePrice: flight.basePrice,
      economyPrice: flight.economyPrice,
      businessPrice: flight.businessPrice,
      firstClassPrice: flight.firstClassPrice,
      aircraftType: flight.aircraftType ?? '',
      stops: flight.stops ?? 0
    };
    this.activeTab = 'flights';
  }

  resetFlightForm() {
    this.editingFlightId = null;
    this.flightForm = this.emptyFlightForm();
  }

  setFlightStatus(flightId: number, status: string) {
    this.flightSvc.updateFlightStatus(flightId, status).subscribe({
      next: () => {
        this.toast.success(`Flight status set to ${status}`);
        this.loadAdminData();
      },
      error: (err) => this.toast.error(this.extractError(err, 'Could not update flight status'))
    });
  }

  deleteFlight(flightId: number) {
    this.flightSvc.deleteFlight(flightId).subscribe({
      next: () => {
        this.toast.success('Flight deleted');
        this.loadAdminData();
      },
      error: (err) => this.toast.error(this.extractError(err, 'Could not delete flight'))
    });
  }

  generateSeats() {
    if (!this.seatForm.flightId) {
      this.toast.error('Enter a flight ID first');
      return;
    }
    this.seatSvc.generateSeats(this.seatForm).subscribe({
      next: () => {
        this.toast.success('Seats generated');
        this.loadSeatMap();
        this.loadAdminData();
      },
      error: (err) => this.toast.error(this.extractError(err, 'Could not generate seats'))
    });
  }

  deleteSeats() {
    if (!this.seatForm.flightId) {
      this.toast.error('Enter a flight ID first');
      return;
    }
    this.seatSvc.deleteSeatsForFlight(this.seatForm.flightId).subscribe({
      next: () => {
        this.toast.success('Seats deleted');
        this.seatMap = null;
      },
      error: (err) => this.toast.error(this.extractError(err, 'Could not delete seats'))
    });
  }

  loadSeatMap() {
    if (!this.seatForm.flightId) {
      this.seatMap = null;
      return;
    }
    this.seatSvc.getSeatMap(this.seatForm.flightId).subscribe({
      next: map => this.seatMap = map,
      error: () => this.seatMap = null
    });
  }

  saveAirline() {
  const { airlineId, ...rest } = this.airlineForm;
  const payload = airlineId ? { airlineId, ...rest } : rest;
  const action$ = airlineId
    ? this.airlineSvc.updateAirline(airlineId, payload)
    : this.airlineSvc.createAirline(payload);
  action$.subscribe({
    next: () => {
      this.toast.success(airlineId ? 'Airline updated' : 'Airline created');
      this.resetAirlineForm();
      this.loadAdminData();
    },
    error: (err) => this.toast.error(this.extractError(err, 'Could not save airline'))
  });
}

  resetAirlineForm() {
    this.airlineForm = this.emptyAirlineForm();
  }

  editAirline(airline: Airline) {
    this.airlineForm = { ...airline };
  }

  toggleAirline(airline: Airline) {
    const action$ = airline.isActive ? this.airlineSvc.deactivateAirline(airline.airlineId) : this.airlineSvc.activateAirline(airline.airlineId);
    action$.subscribe({
      next: () => this.loadAdminData(),
      error: (err) => this.toast.error(this.extractError(err, 'Could not update airline'))
    });
  }

  saveAirport() {
    const payload = { ...this.airportForm };
    const action$ = payload.airportId
      ? this.airlineSvc.updateAirport(payload.airportId, payload)
      : this.airlineSvc.createAirport(payload);
    action$.subscribe({
      next: () => {
        this.toast.success(payload.airportId ? 'Airport updated' : 'Airport created');
        this.resetAirportForm();
        this.loadAdminData();
      },
      error: (err) => this.toast.error(this.extractError(err, 'Could not save airport'))
    });
  }

  resetAirportForm() {
    this.airportForm = this.emptyAirportForm();
  }

  editAirport(airport: Airport) {
    this.airportForm = { ...airport };
  }

  toggleAirport(airport: Airport) {
  const action$ = airport.isActive
    ? this.airlineSvc.deactivateAirport(airport.airportId)
    : this.airlineSvc.activateAirport(airport.airportId);
  action$.subscribe({
    next: () => { airport.isActive = !airport.isActive; },
    error: (err) => this.toast.error(this.extractError(err, 'Could not update airport'))
  });
}

  deactivateUser(user: User) {
    this.auth.deactivateUser(user.userId).subscribe({
      next: () => this.loadAdminData(),
      error: (err) => this.toast.error(this.extractError(err, 'Could not deactivate user'))
    });
  }

  reactivateUser(user: User) {
    this.auth.reactivateUser(user.userId).subscribe({
      next: () => this.loadAdminData(),
      error: (err) => this.toast.error(this.extractError(err, 'Could not reactivate user'))
    });
  }

  loadFlightOperations() {
    if (!this.opsFlightId) {
      this.toast.error('Enter a flight ID first');
      return;
    }
    forkJoin({
      bookings: this.bookingSvc.getBookingsByFlight(this.opsFlightId).pipe(catchError(() => of([] as Booking[]))),
      revenue: this.bookingSvc.getFlightRevenue(this.opsFlightId).pipe(catchError(() => of({ flightId: this.opsFlightId, totalRevenue: 0, confirmedBookings: 0 }))),
      manifest: this.passengerSvc.getManifest(this.opsFlightId).pipe(catchError(() => of([] as any[])))
    }).subscribe({
      next: ({ bookings, revenue, manifest }) => {
        this.bookings = bookings;
        this.flightRevenue = revenue;
        this.manifest = manifest;
        this.toast.success('Loaded flight operations');
      },
      error: (err) => this.toast.error(this.extractError(err, 'Could not load flight operations'))
    });
  }

  getStatusBadge(status: string): string {
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

  private buildFlightPayload() {
    return {
      flightNumber: this.flightForm.flightNumber,
      airlineId: Number(this.flightForm.airlineId),
      originAirportCode: this.flightForm.originAirportCode?.toUpperCase(),
      destinationAirportCode: this.flightForm.destinationAirportCode?.toUpperCase(),
      departureTime: this.toIsoDateTime(this.flightForm.departureTime),
      arrivalTime: this.toIsoDateTime(this.flightForm.arrivalTime),
      totalSeats: Number(this.flightForm.totalSeats),
      basePrice: Number(this.flightForm.basePrice),
      economyPrice: this.flightForm.economyPrice != null ? Number(this.flightForm.economyPrice) : undefined,
      businessPrice: this.flightForm.businessPrice != null ? Number(this.flightForm.businessPrice) : undefined,
      firstClassPrice: this.flightForm.firstClassPrice != null ? Number(this.flightForm.firstClassPrice) : undefined,
      aircraftType: this.flightForm.aircraftType || undefined,
      stops: this.flightForm.stops != null ? Number(this.flightForm.stops) : undefined,
      durationMinutes: this.computeDurationMinutes()
    };
  }

  private computeDurationMinutes(): number {
    const start = new Date(this.toIsoDateTime(this.flightForm.departureTime));
    const end = new Date(this.toIsoDateTime(this.flightForm.arrivalTime));
    return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
  }

  private toIsoDateTime(value: string): string {
    if (!value) return '';
    return value.length === 16 ? `${value}:00` : value;
  }

  private emptyFlightForm() {
    return {
      flightNumber: '',
      airlineId: 1,
      originAirportCode: 'DEL',
      destinationAirportCode: 'MUM',
      departureTime: '',
      arrivalTime: '',
      totalSeats: 180,
      basePrice: 5000,
      economyPrice: 5000,
      businessPrice: 12500,
      firstClassPrice: 20000,
      aircraftType: 'Airbus A320',
      stops: 0
    };
  }

  private emptyAirlineForm() {
    return {
      airlineId: null,
      name: '',
      iataCode: '',
      icaoCode: '',
      country: '',
      contactEmail: '',
      website: '',
      contactPhone: '',
      description: ''
    };
  }

  private emptyAirportForm() {
    return {
      airportId: null,
      name: '',
      iataCode: '',
      icaoCode: '',
      city: '',
      country: '',
      timezone: 'Asia/Kolkata',
      latitude: null,
      longitude: null
    };
  }

  private extractError(err: any, fallback: string): string {
    return err?.error?.message || err?.error?.error || err?.message || fallback;
  }
}
