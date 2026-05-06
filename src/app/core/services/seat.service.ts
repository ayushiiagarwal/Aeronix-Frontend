import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Seat, SeatMapResponse } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class SeatService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getSeatMap(flightId: number): Observable<SeatMapResponse> {
    return this.http.get<SeatMapResponse>(`${this.base}/seats/flight/${flightId}/map`);
  }

  getAvailableSeats(flightId: number): Observable<Seat[]> {
    return this.http.get<Seat[]>(`${this.base}/seats/flight/${flightId}/available`);
  }

  generateSeats(data: {
    flightId: number;
    economyRows?: number;
    businessRows?: number;
    firstClassRows?: number;
    seatsPerRow?: number;
  }): Observable<Seat[]> {
    return this.http.post<Seat[]>(`${this.base}/seats`, data);
  }

  deleteSeatsForFlight(flightId: number): Observable<any> {
    return this.http.delete<any>(`${this.base}/seats/flight/${flightId}`);
  }
}
