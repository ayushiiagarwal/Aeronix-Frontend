import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Booking } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  createBooking(data: any): Observable<Booking> {
    return this.http.post<Booking>(`${this.base}/bookings`, data);
  }

  getMyBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.base}/bookings/my`);
  }

  getBookingById(id: string): Observable<Booking> {
    return this.http.get<Booking>(`${this.base}/bookings/${id}`);
  }

  getBookingByPnr(pnr: string): Observable<Booking> {
    return this.http.get<Booking>(`${this.base}/bookings/pnr/${pnr}`);
  }

  getAllBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.base}/bookings`);
  }

  getBookingsByFlight(flightId: number): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.base}/bookings/flight/${flightId}`);
  }

  getFlightRevenue(flightId: number): Observable<{ flightId: number; totalRevenue: number; confirmedBookings: number }> {
    return this.http.get<{ flightId: number; totalRevenue: number; confirmedBookings: number }>(
      `${this.base}/bookings/flight/${flightId}/revenue`
    );
  }

  getPlatformAnalytics(): Observable<{ totalBookings: number; totalRevenue: number }> {
    return this.http.get<{ totalBookings: number; totalRevenue: number }>(`${this.base}/bookings/analytics`);
  }

  cancelBooking(bookingId: string, reason: string): Observable<Booking> {
    return this.http.put<Booking>(`${this.base}/bookings/${bookingId}/cancel`, { reason });
  }

  checkIn(bookingId: string): Observable<Booking> {
    return this.http.post<Booking>(`${this.base}/bookings/checkin`, { bookingId });
  }

  getUpcoming(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.base}/bookings/my/upcoming`);
  }
}
