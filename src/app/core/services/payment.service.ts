import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Payment } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  initiatePayment(data: { bookingId: string; amount: number; currency: string; paymentMode: string }): Observable<any> {
    return this.http.post<any>(`${this.base}/payments/initiate`, data);
  }

  simulatePayment(bookingId: string): Observable<any> {
    return this.http.post<any>(`${this.base}/payments/simulate/${bookingId}`, {});
  }

  getMyPayments(): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.base}/payments/my`);
  }

  getAllPayments(): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.base}/payments`);
  }

  getAnalytics(): Observable<{ totalRevenue: number; totalTransactions: number }> {
    return this.http.get<{ totalRevenue: number; totalTransactions: number }>(`${this.base}/payments/analytics`);
  }

  getRevenue(from?: string, to?: string): Observable<any> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<any>(`${this.base}/payments/revenue`, { params });
  }

  getPaymentByBooking(bookingId: string): Observable<Payment> {
    return this.http.get<Payment>(`${this.base}/payments/booking/${bookingId}`);
  }

  getReceipt(paymentId: string): Observable<{ receipt: string }> {
    return this.http.get<{ receipt: string }>(`${this.base}/payments/${paymentId}/receipt`);
  }

  refund(bookingId: string, reason: string): Observable<any> {
    return this.http.post<any>(`${this.base}/payments/refund`,
      { bookingId, reason }
    );
  }

  createRazorpayOrder(data: { bookingId: string; amount: number }): Observable<any> {
  return this.http.post<any>(`${this.base}/payments/create-order`, data);
  }

  verifyPayment(data: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    bookingId: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.base}/payments/verify`, data);
  }

  updatePaymentStatus(paymentId: string, status: string): Observable<any> {
    return this.http.put<any>(`${this.base}/payments/${paymentId}/status`, { status });
  }
}
