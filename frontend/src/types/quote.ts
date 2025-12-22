export type QuoteStatus = 
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'revised'
  | 'expired';

export type QuoteType = 
  | 'vendor_to_company'  // Vendor quote to company
  | 'company_to_customer'; // Company quote to customer

export interface OrderQuote {
  id: string;
  order_id: string;
  vendor_id?: string;
  customer_id?: string;
  type: QuoteType;
  
  // Pricing information
  quoted_price: number;
  original_price?: number;
  final_negotiated_price?: number;
  markup_percentage?: number;
  quantity: number;
  unit_price: number;
  
  // Quote details
  description?: string;
  notes?: string;
  terms_conditions?: string;
  
  // Status and tracking
  status: QuoteStatus;
  is_active: boolean;
  
  // Validity period
  valid_until?: string;
  expires_at?: string;
  
  // Response tracking
  response_deadline?: string;
  responded_at?: string;
  
  // Audit fields
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  
  // Related entities
  order?: {
    id: string;
    order_number: string;
    customer_name?: string;
    product_name?: string;
  };
  vendor?: {
    id: string;
    name: string;
    email: string;
    contact_person?: string;
  };
  customer?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface QuoteRevision {
  id: string;
  quote_id: string;
  revision_number: number;
  previous_price: number;
  new_price: number;
  reason: string;
  created_by: string;
  created_at: string;
}

export interface QuoteComment {
  id: string;
  quote_id: string;
  user_id: string;
  comment: string;
  is_internal: boolean; // Internal notes vs customer-visible comments
  created_at: string;
  user?: {
    name: string;
    role: string;
  };
}

export interface CreateQuoteRequest {
  order_id: string;
  vendor_id?: string;
  customer_id?: string;
  type: QuoteType;
  quoted_price: number;
  quantity: number;
  description?: string;
  notes?: string;
  terms_conditions?: string;
  valid_until?: string;
  markup_percentage?: number;
}

export interface UpdateQuoteRequest {
  quoted_price?: number;
  quantity?: number;
  description?: string;
  notes?: string;
  terms_conditions?: string;
  valid_until?: string;
  markup_percentage?: number;
  status?: QuoteStatus;
}

export interface QuoteResponse {
  data: OrderQuote[];
  meta?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export interface QuoteFilters {
  status?: QuoteStatus;
  type?: QuoteType;
  vendor_id?: string;
  customer_id?: string;
  order_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  sort_by?: 'created_at' | 'quoted_price' | 'valid_until' | 'status';
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

// Quote statistics for dashboard
export interface QuoteStatistics {
  total_quotes: number;
  pending_quotes: number;
  accepted_quotes: number;
  rejected_quotes: number;
  expired_quotes: number;
  average_response_time: number; // in hours
  total_quoted_value: number;
  accepted_value: number;
  conversion_rate: number; // percentage
}

// For quote negotiation workflow
export interface NegotiationStep {
  id: string;
  quote_id: string;
  step_type: 'initial_quote' | 'counter_offer' | 'final_offer' | 'acceptance' | 'rejection';
  proposed_price: number;
  proposed_by: 'vendor' | 'company' | 'customer';
  message?: string;
  created_at: string;
  created_by?: string;
}

export interface QuoteNegotiation {
  id: string;
  quote_id: string;
  status: 'active' | 'completed' | 'abandoned';
  steps: NegotiationStep[];
  current_price: number;
  target_price?: number;
  created_at: string;
  completed_at?: string;
}