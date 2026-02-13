/**
 * Vendor Portal Types
 * 
 * TypeScript interfaces for the vendor portal system.
 * These types align with the backend API responses (snake_case).
 * 
 * IMPORTANT: All fields use snake_case to match backend API responses.
 */

// ============================================================================
// User & Authentication Types
// ============================================================================

/**
 * Vendor User - User account for vendor portal access
 * Extends the base User model with vendor-specific fields
 */
export interface VendorUser {
  id: string;
  uuid?: string;
  email: string;
  name: string;
  first_name?: string;
  last_name?: string;
  
  // Vendor-specific fields
  account_type: 'vendor';
  vendor_id: string;
  
  // Account status
  status: 'active' | 'inactive' | 'suspended' | 'banned';
  is_email_verified: boolean;
  email_verified_at?: string;
  
  // Security
  two_factor_enabled: boolean;
  failed_login_attempts: number;
  locked_until?: string;
  must_change_password?: boolean;
  
  // Activity tracking
  last_login_at?: string;
  last_login_ip?: string;
  last_activity_at?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

/**
 * Vendor Profile - Extended vendor information for portal
 * Combines vendor entity with portal-specific fields
 */
export interface VendorProfile {
  // Core vendor fields
  id: string;
  uuid: string;
  tenant_id: string;
  
  // Company information
  company_name: string;
  email: string;
  phone?: string;
  mobile_phone?: string;
  contact_person?: string;
  
  // Address
  address?: string;
  city?: string;
  province?: string;
  country?: string;
  postal_code?: string;
  location?: {
    latitude: number;
    longitude: number;
    city?: string;
    province?: string;
    country?: string;
  };
  
  // Business details
  status: 'active' | 'inactive' | 'on_hold' | 'blacklisted';
  quality_tier?: 'standard' | 'premium' | 'exclusive';
  is_verified: boolean;
  verified_at?: string;
  
  // Portal access fields
  onboarding_status: 'pending' | 'in_progress' | 'completed';
  onboarding_completed_at?: string;
  portal_access_enabled: boolean;
  portal_last_access_at?: string;
  welcome_email_sent_at?: string;
  temporary_password_expires_at?: string;
  
  // Performance metrics
  overall_rating?: number;
  quality_rating?: number;
  timeliness_rating?: number;
  communication_rating?: number;
  total_orders: number;
  completed_orders: number;
  total_transaction_value?: number;
  
  // Capabilities
  average_lead_time_days?: number;
  production_capacity_monthly?: number;
  minimum_order_value?: number;
  accepts_rush_orders?: boolean;
  rush_order_surcharge_percent?: number;
  
  // Banking
  bank_name?: string;
  bank_account_number?: string;
  bank_account_holder?: string;
  
  // Additional
  specializations?: string[];
  certifications?: string[];
  notes?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

/**
 * Vendor Authentication Response
 * Response from POST /api/v1/vendor/auth/login
 */
export interface VendorAuthResponse {
  success: boolean;
  data: {
    token: string;
    token_type: 'Bearer';
    expires_in: number;
    user: VendorUser;
    vendor: VendorProfile;
  };
  message?: string;
}

/**
 * Vendor Login Request
 * Request body for POST /api/v1/vendor/auth/login
 */
export interface VendorLoginRequest {
  email: string;
  password: string;
}

/**
 * Password Reset Request
 * Request body for POST /api/v1/vendor/auth/password/email
 */
export interface VendorPasswordResetRequest {
  email: string;
}

/**
 * Password Reset Confirmation
 * Request body for POST /api/v1/vendor/auth/password/reset
 */
export interface VendorPasswordResetConfirmation {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
}

// ============================================================================
// Quote Types
// ============================================================================

/**
 * Quote Status
 * Possible states for a quote in the vendor portal
 */
export type QuoteStatus = 
  | 'draft'
  | 'sent'
  | 'pending_response'
  | 'accepted'
  | 'rejected'
  | 'countered'
  | 'expired';

/**
 * Quote Response Type
 * Type of response a vendor can give to a quote
 */
export type QuoteResponseType = 'accept' | 'reject' | 'counter';

/**
 * Vendor Quote - Quote assigned to vendor
 * Represents order_vendor_negotiations table
 */
export interface VendorQuote {
  id: string;
  uuid: string;
  tenant_id: string;
  
  // References
  order_id: string;
  vendor_id: string;
  quote_number: string;
  
  // Status
  status: QuoteStatus;
  response_type?: QuoteResponseType;
  
  // Pricing
  vendor_price?: number;
  counter_offer_amount?: number;
  estimated_delivery_days?: number;
  
  // Response details
  rejection_reason?: string;
  notes?: string;
  
  // Timestamps
  sent_at?: string;
  responded_at?: string;
  expires_at?: string;
  closed_at?: string;
  created_at: string;
  updated_at: string;
  
  // Related data (when included)
  order?: {
    id: string;
    uuid: string;
    order_number: string;
    customer_name?: string;
    total_amount: number;
    status: string;
  };
  
  customer?: {
    id: string;
    name: string;
    email?: string;
    company?: string;
  };
  
  product?: {
    id: string;
    name: string;
    sku?: string;
    specifications?: Record<string, unknown>;
  };
  
  // Quote details (JSONB field)
  quote_details?: {
    product_specifications?: Record<string, unknown>;
    delivery_requirements?: Record<string, unknown>;
    admin_notes?: string;
    history?: Array<{
      action: string;
      timestamp: string;
      user_id: string;
      data?: Record<string, unknown>;
    }>;
  };
  
  // Message count (calculated field)
  unread_message_count?: number;
}

/**
 * Quote Item - Individual item in a quote
 * SECURITY: Only vendor_cost is exposed, NEVER unit_price/total_price (customer pricing)
 */
export interface QuoteItem {
  product_id: string;
  description: string;
  quantity: number;
  vendor_cost: number; // Price PT CEX offers to vendor
  total_vendor_cost?: number; // Total vendor cost (vendor_cost * quantity)
  specifications?: Record<string, unknown>;
  notes?: string;
  product_name?: string;
}

/**
 * Quote Detail - Extended quote with all related data
 * Used for detailed quote view with complete information
 */
export interface QuoteDetail extends VendorQuote {
  // All fields from VendorQuote are included
  // Plus guaranteed related data (not optional)
  order: {
    id: string;
    uuid: string;
    order_number: string;
    customer_name: string;
    customer_email?: string;
    customer_company?: string;
    total_amount: number;
    status: string;
    created_at: string;
  };
  
  customer: {
    id: string;
    uuid?: string;
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    address?: string;
  };
  
  product?: {
    id: string;
    uuid?: string;
    name: string;
    sku?: string;
    description?: string;
    specifications?: Record<string, unknown>;
    category?: string;
  } | null;
  
  // Items array extracted from quote_details
  items?: QuoteItem[];
  
  // Enhanced quote details
  quote_details: {
    title?: string;
    description?: string;
    terms_and_conditions?: string;
    notes?: string;
    items?: QuoteItem[];
    product_specifications?: Record<string, unknown>;
    delivery_requirements?: {
      address?: string;
      special_instructions?: string;
      preferred_delivery_date?: string;
    };
    admin_notes?: string;
    internal_notes?: string;
    counter_offer?: {
      items: Array<{
        product_id: string;
        product_name: string;
        quantity: number;
        original_unit_price: number;
        original_total_price: number;
        counter_unit_price: number;
        counter_total_price: number;
        difference_amount: number;
        notes?: string;
      }>;
      total_counter: number;
      notes?: string;
      estimated_delivery_days?: number;
      submitted_at?: string;
    };
    history?: Array<{
      action: string;
      timestamp: string;
      user_id: string;
      user_name?: string;
      data?: Record<string, unknown>;
    }>;
    attachments?: Array<{
      filename: string;
      url: string;
      size: number;
      type: string;
      uploaded_at: string;
    }>;
  };
  
  // Message thread summary
  message_summary?: {
    total_messages: number;
    unread_messages: number;
    last_message_at?: string;
    last_message_from?: MessageSenderType;
  };
}

/**
 * Quote Statistics - Aggregated statistics for vendor quotes
 * Used for dashboard and analytics
 */
export interface QuoteStatistics {
  // Count by status
  total_quotes: number;
  pending_quotes: number;
  accepted_quotes: number;
  rejected_quotes: number;
  countered_quotes: number;
  expired_quotes: number;
  draft_quotes: number;
  
  // Performance metrics
  acceptance_rate: number; // Percentage (0-100)
  rejection_rate: number; // Percentage (0-100)
  counter_rate: number; // Percentage (0-100)
  
  // Response time metrics
  average_response_time_hours: number;
  median_response_time_hours: number;
  fastest_response_time_hours: number;
  slowest_response_time_hours: number;
  
  // Time-based statistics
  quotes_this_week: number;
  quotes_this_month: number;
  quotes_expiring_soon: number; // Within 3 days
  
  // Value metrics
  total_quote_value: number;
  accepted_quote_value: number;
  average_quote_value: number;
  
  // Trend data (optional)
  trend?: {
    period: 'week' | 'month' | 'quarter' | 'year';
    quotes_change_percent: number; // Positive or negative
    acceptance_rate_change_percent: number;
    response_time_change_percent: number;
  };
}

/**
 * Quote List Response
 * Response from GET /api/v1/vendor/quotes
 */
export interface VendorQuoteListResponse {
  success: boolean;
  data: {
    quotes: VendorQuote[];
    pagination: {
      total: number;
      per_page: number;
      current_page: number;
      last_page: number;
      from: number;
      to: number;
    };
    statistics: QuoteStatistics;
  };
}

/**
 * Quote Detail Response
 * Response from GET /api/v1/vendor/quotes/{uuid}
 */
export interface VendorQuoteDetailResponse {
  success: boolean;
  data: QuoteDetail;
}

/**
 * Quote Filters
 * Query parameters for GET /api/v1/vendor/quotes
 */
export interface VendorQuoteFilters {
  page?: number;
  per_page?: number;
  search?: string;
  status?: QuoteStatus;
  sort?: string;
  order?: 'asc' | 'desc';
  date_from?: string;
  date_to?: string;
}

/**
 * Accept Quote Request
 * Request body for POST /api/v1/vendor/quotes/{uuid}/accept
 */
export interface AcceptQuoteRequest {
  estimated_delivery_days: number;
  notes?: string;
}

/**
 * Reject Quote Request
 * Request body for POST /api/v1/vendor/quotes/{uuid}/reject
 */
export interface RejectQuoteRequest {
  rejection_reason: string;
}

/**
 * Counter Offer Request
 * Request body for POST /api/v1/vendor/quotes/{uuid}/counter-offer
 */
export interface CounterOfferRequest {
  items: CounterOfferItemRequest[];
  notes?: string;
  estimated_delivery_days?: number;
}

/**
 * Counter Offer Item Request
 * Individual item in counter offer request
 */
export interface CounterOfferItemRequest {
  product_id: string;
  counter_unit_price: number;
  notes?: string;
}

// ============================================================================
// Message Types
// ============================================================================

/**
 * Sender Type
 * Who sent the message
 */
export type MessageSenderType = 'admin' | 'vendor';

/**
 * Message Attachment
 * File attached to a quote message
 */
export interface MessageAttachment {
  filename: string;
  url: string;
  size: number;
  type: string;
}

/**
 * Quote Message
 * Message in a quote thread
 */
export interface QuoteMessage {
  id: string;
  uuid: string;
  tenant_id: string;
  
  // References
  quote_id: string;
  sender_id: string;
  
  // Content
  message: string;
  attachments: MessageAttachment[];
  
  // Metadata
  sender_type: MessageSenderType;
  is_read: boolean;
  read_at?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  
  // Related data (when included)
  sender?: {
    id: string;
    name: string;
    email?: string;
  };
}

/**
 * Message List Response
 * Response from GET /api/v1/vendor/quotes/{uuid}/messages
 */
export interface QuoteMessageListResponse {
  message: string;
  data: QuoteMessage[];
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
}

/**
 * Send Message Request
 * Request body for POST /api/v1/vendor/quotes/{uuid}/messages
 */
export interface SendMessageRequest {
  message: string;
  attachments?: File[];
}

// ============================================================================
// Profile Types
// ============================================================================

/**
 * Vendor Performance Metrics
 * Performance statistics for vendor dashboard
 */
export interface VendorPerformanceMetrics {
  total_quotes: number;
  accepted_quotes: number;
  rejected_quotes: number;
  pending_quotes: number;
  countered_quotes: number;
  expired_quotes: number;
  
  acceptance_rate: number; // Percentage
  average_response_time: number; // Hours
  
  total_orders: number;
  completed_orders: number;
  completion_rate: number; // Percentage
  
  overall_rating: number;
  quality_rating: number;
  timeliness_rating: number;
  communication_rating: number;
}

/**
 * Vendor Profile Response
 * Response from GET /api/v1/vendor/profile
 */
export interface VendorProfileResponse {
  success: boolean;
  data: {
    vendor: VendorProfile;
    metrics: VendorPerformanceMetrics;
  };
}

/**
 * Update Profile Request
 * Request body for PUT /api/v1/vendor/profile
 */
export interface UpdateVendorProfileRequest {
  email?: string;
  phone?: string;
  mobile_phone?: string;
  contact_person?: string;
  address?: string;
  city?: string;
  province?: string;
  country?: string;
  postal_code?: string;
}

// ============================================================================
// Dashboard Types
// ============================================================================

/**
 * Vendor Dashboard Statistics
 * Summary statistics for vendor dashboard
 */
export interface VendorDashboardStats {
  quotes: {
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
    countered: number;
    expired: number;
  };
  
  performance: {
    acceptance_rate: number;
    average_response_time: number;
    completion_rate: number;
    overall_rating: number;
  };
  
  recent_activity: {
    new_quotes_today: number;
    expiring_soon: number;
    unread_messages: number;
  };
}

/**
 * Dashboard Response
 * Response from GET /api/v1/vendor/dashboard
 */
export interface VendorDashboardResponse {
  success: boolean;
  data: {
    statistics: VendorDashboardStats;
    recent_quotes: VendorQuote[];
    pending_actions: VendorQuote[];
  };
}

// ============================================================================
// Notification Types
// ============================================================================

/**
 * Vendor Notification Type
 */
export type VendorNotificationType = 
  | 'new_quote'
  | 'quote_reminder'
  | 'quote_expired'
  | 'quote_message'
  | 'quote_updated';

/**
 * Vendor Notification
 * In-app notification for vendor
 */
export interface VendorNotification {
  id: string;
  tenant_id: string;
  user_id: string;
  
  type: VendorNotificationType;
  title: string;
  message: string;
  
  data?: {
    quote_id?: string;
    quote_number?: string;
    message_id?: string;
    [key: string]: unknown;
  };
  
  read_at?: string;
  created_at: string;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * API Error Response
 * Standard error response format
 */
export interface VendorApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  code?: string;
}

/**
 * Validation Error
 * Field-level validation errors
 */
export interface ValidationError {
  field: string;
  message: string;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Pagination Metadata
 * Standard pagination structure
 */
export interface PaginationMeta {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  from: number;
  to: number;
}

/**
 * API Response Wrapper
 * Generic API response structure
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

/**
 * Paginated Response
 * Generic paginated response structure
 */
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
}
