export interface User {
  userId: number;
  fullName: string;
  email: string;
  phone?: string;
  passportNumber?: string;
  nationality?: string;
  role: 'PASSENGER' | 'AIRLINE_STAFF' | 'ADMIN';
  isActive: boolean;
  provider?: 'LOCAL' | 'GOOGLE';
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  userId: number;
  email: string;
  fullName: string;
  role: string;
}

export interface Flight {
  flightId: number;
  flightNumber: string;
  airlineId: number;
  originAirportCode: string;
  destinationAirportCode: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  aircraftType?: string;
  totalSeats: number;
  availableSeats: number;
  basePrice: number;
  economyPrice: number;
  businessPrice: number;
  firstClassPrice: number;
  stops: number;
  status: string;
}

export interface Booking {
  bookingId: string;
  userId: number;
  flightId: number;
  returnFlightId?: number;
  pnrCode: string;
  tripType: 'ONE_WAY' | 'ROUND_TRIP';
  status: string;
  baseFare: number;
  taxes: number;
  luggageCharge: number;
  ancillaryCharges: number;
  totalFare: number;
  passengerCount: number;
  seatClass: string;
  mealPreference?: string;
  contactEmail: string;
  contactPhone: string;
  checkedIn: boolean;
  bookedAt: string;
  confirmedAt?: string;
  cancelledAt?: string;
  paymentId?: string;
}

export interface Seat {
  seatId: number;
  flightId: number;
  seatNumber: string;
  seatClass: string;
  seatRow?: number;
  seatColumn?: string;
  status: string;
  price?: number;
  isWindow?: boolean;
  isAisle?: boolean;
  hasExtraLegroom?: boolean;
  heldAt?: string;
  heldByUserId?: string;
  version?: number;
}

export interface SeatMapResponse {
  flightId: number;
  seatsByClass: Record<string, Seat[]>;
  totalAvailable: number;
  totalSeats: number;
}

export interface Payment {
  paymentId: string;
  bookingId: string;
  userId: number;
  amount: number;
  currency: string;
  status: string;
  paymentMode: string;
  gatewayOrderId?: string;
  transactionId?: string;
  paidAt?: string;
}

export interface FareSummary {
  baseFare: number;
  gstAmount: number;
  fuelSurcharge: number;
  luggageCharge: number;
  totalTax: number;
  totalFare: number;
  seatClass: string;
  passengerCount: number;
}

export interface Notification {
  notificationId: number;
  recipientId: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  sentAt: string;
  relatedBookingId?: string;
}

export interface Airport {
  airportId: number;
  name: string;
  iataCode: string;
  city: string;
  country: string;
  timezone: string;
  displayName?: string;
  isActive: boolean;
}

export interface Airline {
  airlineId: number;
  name: string;
  iataCode: string;
  icaoCode?: string;
  logoUrl?: string;
  country: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Passenger {
  passengerId: number;
  bookingId: string;
  firstName: string;
  lastName: string;
  title?: string;
  dateOfBirth: string;
  gender: string;
  passportNumber?: string;
  nationality?: string;
  passengerType: string;
  seatNumber?: string;
  ticketNumber?: string;
  checkedIn: boolean;
  mealPreference: string;
}

export interface FlightSearchForm {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  seatClass: string;
  tripType: 'ONE_WAY' | 'ROUND_TRIP';
}
