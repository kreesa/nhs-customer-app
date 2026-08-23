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

export interface Profile {
  id: number;
  name: string;
  email: string;
  role: string;
  phone_number: string;
}

// ─── Service Categories ───────────────────────────────────────────────────────
export interface ServiceCategory {
  id: number;
  name: string;
  icon?: string;
  execution_mode: string;
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
  service_category_id: number;
  service_sub_category_id: number;
  description: string;
  files?: string[];   //problem_images
  site_address: string;
  site_longitude: number;
  site_latitude: number;
  scheduled_for: string;
  scheduled_time_slot: string;
  status: ServiceStatus;
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
  service_category_id: number;
  service_sub_category_id: number;
  description: string;
  files?: string[];  //problem_images
  site_address: string;
  site_longitude: number;
  site_latitude: number;
  scheduled_for: string;
  scheduled_time_slot: string;
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

// ─── InvoiceSummary ──────────────────────────────────────────────────────────
export interface InvoiceSummary {
  invoice_status: "draft" | "finalized" | "paid"; // adjust if there are more states
  subtotal_labor: string;
  subtotal_material: string;
  subtotal_logistics: string;
  commission_amount: string;
  tax_amount: string;
  discount_amount: string;
  total_amount: string;
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
