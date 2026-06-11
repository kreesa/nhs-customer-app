// ─── Auth ────────────────────────────────────────────────────────────────────
export interface User {
  id: number;
  name: string;
  email: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  device_name: string;
}

export interface RegisterPayload {
  full_name: string;
  phone: string;
  service_address: string;
  email: string;
  password: string;
  confirm_password: string;
}

export interface AuthResponse {
  token: string;
  user: Customer;
}

// ─── Customer ────────────────────────────────────────────────────────────────
export interface Customer {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  service_address: string;
  latitude?: number;
  longitude?: number;
  preferred_timeslot?: string;
  notification_preference?: string;
  created_at?: string;
}

// ─── Service Categories ───────────────────────────────────────────────────────
export interface ServiceCategory {
  id: number;
  name: string;
  icon?: string;
}

export interface ServiceSubCategory {
  id: number;
  name: string;
  service_category_id: number;
}

// ─── Service Request ─────────────────────────────────────────────────────────
export type ServiceStatus =
  | 'Request received'
  | 'Technician Assigned'
  | 'Work In Progress'
  | 'On Hold'
  | 'Completed';

export interface ServiceRequest {
  id: number;
  customer_id: number;
  service_category: number;
  service_subcategory: number;
  problem_description: string;
  problem_images?: string[];
  service_location: string;
  longitude: number;
  latitude: number;
  requested_date: string;
  requested_timeslot: string;
  service_status: ServiceStatus;
  technician_en_route: boolean;
  technician_arrival_onsite: boolean;
  need_assistance: boolean;
  send_quotation_to_customer: boolean;
  agreed_to_quotation: boolean;
  total_payable_amount?: number;
  payment_method?: 'Online' | 'Cash';
  payment_screenshot?: string;
  payment_remark?: string;
  customer_confirmation_signature?: string;
  customer_complaint?: string;
  assigned_technician?: Technician;
  created_at?: string;
}

export interface ServiceRequestPayload {
  service_category: number;
  service_subcategory: number;
  problem_description: string;
  problem_images?: string[];
  service_location: string;
  longitude: number;
  latitude: number;
  requested_date: string;
  requested_timeslot: string;
}

// ─── Technician ───────────────────────────────────────────────────────────────
export interface Technician {
  id: number;
  full_name: string;
  specialization?: string;
  experience_years?: number;
  rating?: number;
  total_jobs?: number;
  phone?: string;
  current_latitude?: number;
  current_longitude?: number;
}

// ─── Tracking ────────────────────────────────────────────────────────────────
export interface TrackingData {
  technician_id: number;
  latitude: number;
  longitude: number;
  eta_minutes?: number;
  distance_km?: number;
}

// ─── Pricing ─────────────────────────────────────────────────────────────────
export interface PricingDetail {
  id: number;
  fee_type: string;
  material_type?: string;
  amount: number;
}

export interface PricingSummary {
  items: PricingDetail[];
  total: number;
}

// ─── Payment ─────────────────────────────────────────────────────────────────
export interface PaymentPayload {
  agreed_to_quotation: boolean;
  total_payable_amount: number;
  payment_method: 'Online' | 'Cash';
  payment_screenshot?: string;
  payment_remark?: string;
}

// ─── Feedback ────────────────────────────────────────────────────────────────
export type TopQuality =
  | 'Punctual'
  | 'Polite'
  | 'Skilled'
  | 'Honest'
  | 'Clean Work'
  | 'Quick Response'
  | 'Reliable';

export interface FeedbackPayload {
  service_id: number;
  technician_id: number;
  overall_rating: number;
  top_qualities: TopQuality[];
  use_service_again: boolean;
  remark?: string;
}

// ─── Navigation ──────────────────────────────────────────────────────────────
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  Request: undefined;
  Track: { serviceId: number };
  Payment: { serviceId: number };
  Feedback: { serviceId: number; technicianId: number; amount: number };
  Profile: undefined;
};
