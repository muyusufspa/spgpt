export interface Airport {
  id: string;
  name: string;
  city_en: string;
  city_ar: string;
  country: string;
  iata: string;
  icao: string;
  region: string;
}

export interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
  isLoading?: boolean;
  apiResponse?: { success: boolean; body: any };
  isAgenticLink?: boolean;
  data?: InvoiceData;
  showInvoice?: boolean;
  showRequestPayload?: any;
  showAirportSelector?: boolean;
}

export interface ProductLine {
  product_name: string;
  quantity: number;
  unit_price: number;
  discount: number;
  spa_aircraft_tail_number: number;
  tax: string;
}

export interface BillAttachment {
  filename: string;
  mimetype: string;
  data?: string; // base64 string
}

export interface InvoiceData {
  request_owner: string;
  vendor_name: string | null;
  rsaf_bill: boolean | null;
  service_type: string | null;
  ht_id: number | null;
  ir_id: boolean | null;
  cr_id: boolean | null;
  gs_id: boolean | null;
  fsr_id: string | null;
  bill_date: string;
  reference: string;
  currency: string;
  bill_attachments: BillAttachment[];
  payment_terms: string;
  departure_iata: string | null;
  departure_icao: string | null;
  arrival_iata: string | null;
  arrival_icao: string | null;
  approver_level1: number | null;
  approver_level2: number | null;
  approver_level3: number | null;
  product_lines: ProductLine[];
}

export interface InvoiceHistoryEntry {
  reference: string;
  vendor_name: string;
  processedDate: string; // ISO string
  totalAmount: number;
  currency: string;
  isPosted: boolean;
}

export type AppStatus = 'idle' | 'processing' | 'success' | 'error';

export interface UserProfile {
  name: string;
  email: string;
  is_admin: boolean;
}

export interface UserSettings {
  theme: 'sky' | 'midnight';
  language?: 'en' | 'ar';
  timezone?: string;
  dateFormat?: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  notifications?: {
    email: boolean;
    toast: boolean;
  };
  accessibility?: {
    reducedMotion: boolean;
    highContrast: boolean;
  };
}

export interface ActivityEntry {
  id: number;
  user: string; // The user who performed the action (email/username)
  action: string;
  timestamp: number;
}

// Represents the user schema for the simulated SQLite database.
export interface MockDbUser {
  id: number;
  username: string;
  // NOTE: Storing plaintext for simulation. Represents a bcrypt hash in a real system.
  password_hash: string;
  created_at: string;
  last_login_at: string | null;
  is_active: 1 | 0;
  is_admin: 1 | 0;
}