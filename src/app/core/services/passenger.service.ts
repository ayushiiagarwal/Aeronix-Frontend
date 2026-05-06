import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Passenger } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class PassengerService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getByBooking(bookingId: string): Observable<Passenger[]> {
    return this.http.get<Passenger[]>(`${this.base}/passengers/booking/${bookingId}`);
  }

  getManifest(flightId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/passengers/flight/${flightId}/manifest`);
  }

  getByFlight(flightId: number): Observable<Passenger[]> {
    return this.http.get<Passenger[]>(`${this.base}/passengers/flight/${flightId}`);
  }
}
