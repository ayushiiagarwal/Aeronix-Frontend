import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) },
  { path: 'auth/login', loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent) },
  { path: 'auth/register', loadComponent: () => import('./features/auth/register.component').then(m => m.RegisterComponent) },
  { path: 'flights', loadComponent: () => import('./features/flights/flight-search.component').then(m => m.FlightSearchComponent) },
  { path: 'pnr', loadComponent: () => import('./features/booking/pnr-lookup.component').then(m => m.PnrLookupComponent) },
  { path: 'booking', loadComponent: () => import('./features/booking/booking.component').then(m => m.BookingComponent), canActivate: [authGuard] },
  { path: 'booking/confirmation', loadComponent: () => import('./features/booking/booking-confirmation.component').then(m => m.BookingConfirmationComponent), canActivate: [authGuard] },
  { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent), canActivate: [authGuard] },
  { path: 'notifications', loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsComponent), canActivate: [authGuard] },
  { path: 'profile', loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent), canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
