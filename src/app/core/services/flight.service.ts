import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Flight, FareSummary } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class FlightService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  searchFlights(params: {
    origin: string; destination: string; date: string;
    passengers?: number; minPrice?: number; maxPrice?: number;
    airlineId?: number; seatClass?: string; sortBy?: string;
  }): Observable<Flight[]> {
    let p = new HttpParams()
      .set('origin', params.origin)
      .set('destination', params.destination)
      .set('date', params.date)
      .set('passengers', params.passengers ?? 1);
    if (params.minPrice) p = p.set('minPrice', params.minPrice);
    if (params.maxPrice) p = p.set('maxPrice', params.maxPrice);
    if (params.airlineId) p = p.set('airlineId', params.airlineId);
    if (params.seatClass) p = p.set('seatClass', params.seatClass);
    if (params.sortBy) p = p.set('sortBy', params.sortBy);
    return this.http.get<Flight[]>(`${this.base}/flights/search`, { params: p });
  }

  searchRoundTrip(params: any): Observable<{ outbound: Flight[]; returnFlights: Flight[] }> {
    let p = new HttpParams()
      .set('origin', params.origin).set('destination', params.destination)
      .set('departureDate', params.departureDate).set('returnDate', params.returnDate)
      .set('passengers', params.passengers ?? 1);
    if (params.seatClass) p = p.set('seatClass', params.seatClass);
    return this.http.get<any>(`${this.base}/flights/round-trip`, { params: p });
  }

  getFlightById(id: number): Observable<Flight> {
    return this.http.get<Flight>(`${this.base}/flights/${id}`);
  }

  getAllFlights(): Observable<Flight[]> {
    return this.http.get<Flight[]>(`${this.base}/flights`);
  }

  getFlightsByStatus(status: string): Observable<Flight[]> {
    return this.http.get<Flight[]>(`${this.base}/flights/status/${status}`);
  }

  getFlightsByAirline(airlineId: number): Observable<Flight[]> {
    return this.http.get<Flight[]>(`${this.base}/flights/airline/${airlineId}`);
  }

  createFlight(data: any): Observable<Flight> {
    return this.http.post<Flight>(`${this.base}/flights`, data);
  }

  updateFlight(flightId: number, data: any): Observable<Flight> {
    return this.http.put<Flight>(`${this.base}/flights/${flightId}`, data);
  }

  updateFlightStatus(flightId: number, status: string): Observable<any> {
    return this.http.put<any>(`${this.base}/flights/${flightId}/status`, { status });
  }

  deleteFlight(flightId: number): Observable<any> {
    return this.http.delete<any>(`${this.base}/flights/${flightId}`);
  }

  getFare(flightId: number, seatClass: string, passengerCount: number): Observable<FareSummary> {
    const p = new HttpParams()
      .set('flightId', flightId).set('seatClass', seatClass)
      .set('passengerCount', passengerCount);
    return this.http.get<FareSummary>(`${this.base}/bookings/fare`, { params: p });
  }

  searchAirports(query: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/airports/search`, {
      params: new HttpParams().set('query', query)
    });
  }
}
