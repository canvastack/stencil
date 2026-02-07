export interface Quote {
  uuid: string;
  quote_number: string;
  tenant_id: number;
  order_id: number;
  vendor_id: number;
  status: {
    value: string;
    label: string;
    color: string;
  };
  initial_offer: number | null;
  latest_offer: number | null;
  currency: string;
  quote_details: {
    product_name?: string;
    quantity?: number;
    specifications?: Record<string, any>;
    notes?: string;
    estimated_delivery_days?: number;
    [key: string]: any;
  } | null;
  history: Array<{
    action: string;
    timestamp: string;
    user_id: number;
    notes?: string;
    [key: string]: any;
  }>;
  status_history: Array<{
    from: string | null;
    to: string;
    changed_by: number | null;
    changed_at: string;
    reason: string | null;
  }>;
  round: number;
  sent_at: string | null;
  responded_at: string | null;
  response_type: string | null;
  response_notes: string | null;
  expires_at: string | null;
  closed_at: string | null;
  is_expired: boolean;
  created_at: string;
  updated_at: string;
  order?: {
    uuid: string;
    order_number: string;
    customer?: {
      uuid: string;
      name: string;
      email: string;
    };
  };
  vendor?: {
    uuid: string;
    name: string;
    email: string;
  };
}

export interface QuoteFilters {
  status: string | null;
  dateRange: { from: Date; to: Date } | null;
  vendorId: string | null;
  searchTerm: string;
}
