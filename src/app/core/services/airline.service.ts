import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Airline, Airport } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class AirlineService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getAirlines(): Observable<Airline[]> {
    return this.http.get<Airline[]>(`${this.base}/airlines`);
  }

  getAllAirlines(): Observable<Airline[]> {
    return this.http.get<Airline[]>(`${this.base}/airlines/all`);
  }

  createAirline(data: any): Observable<Airline> {
    return this.http.post<Airline>(`${this.base}/airlines`, data);
  }

  updateAirline(airlineId: number, data: any): Observable<Airline> {
    return this.http.put<Airline>(`${this.base}/airlines/${airlineId}`, data);
  }

  activateAirline(airlineId: number): Observable<any> {
    return this.http.put<any>(`${this.base}/airlines/${airlineId}/activate`, {});
  }

  deactivateAirline(airlineId: number): Observable<any> {
    return this.http.put<any>(`${this.base}/airlines/${airlineId}/deactivate`, {});
  }

  getAirports(): Observable<Airport[]> {
    return this.http.get<Airport[]>(`${this.base}/airports`);
  }

  getAllAirports(): Observable<Airport[]> {
    return this.http.get<Airport[]>(`${this.base}/airports/all`);
  }

  createAirport(data: any): Observable<Airport> {
    return this.http.post<Airport>(`${this.base}/airports`, data);
  }

  updateAirport(airportId: number, data: any): Observable<Airport> {
    return this.http.put<Airport>(`${this.base}/airports/${airportId}`, data);
  }

  deactivateAirport(airportId: number): Observable<any> {
    return this.http.put<any>(`${this.base}/airports/${airportId}/deactivate`, {});
  }

  activateAirport(airportId: number): Observable<Airport> {
  return this.http.put<Airport>(`${this.base}/airports/${airportId}/activate`, {});
  }

}
