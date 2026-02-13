# Vendor Portal API Documentation

## Overview

The Vendor Portal API provides a comprehensive set of endpoints for vendors to manage their quotes, communicate with administrators, and maintain their profile information. The API follows RESTful principles and uses JWT-based authentication via Laravel Sanctum.

## Base URL

```
Production: https://api.stencil.canvastack.com/v1
Staging: https://api-staging.stencil.canvastack.com/v1
Development: http://localhost:8000/api/v1
```

## Authentication

### Bearer Token Authentication

All vendor portal endpoints (except login and password reset request) require authentication using a Bearer token obtained from the login endpoint.

**Header Format:**
```
Authorization: Bearer {sanctum_token}
```

**Token Abilities:** `vendor:access`

**Token Expiration:** 24 hours (86400 seconds)

### Security Requirements

For a vendor to access the portal, the following conditions must be met:

1. **Account Type:** User account must have `account_type = 'vendor'`
2. **Portal Access:** Vendor must have `portal_access_enabled = true`
3. **Onboarding:** Vendor must have `onboarding_status = 'completed'`
4. **Vendor Status:** Vendor must have `status = 'active'`
5. **Account Status:** User account must have `status = 'active'`

### Rate Limiting

- **Login Endpoint:** 5 attempts per 15 minutes per IP address
- **Password Reset Request:** 1 request per 60 seconds per email
- **API Endpoints:** 60 requests per minute per authenticated user

## API Endpoints

### Authentication

#### 1. Login
```http
POST /api/v1/vendor/auth/login
```

Authenticate vendor user and obtain access token.

**Request Body:**
```json
{
  "email": "vendor@example.com",
  "password": "SecurePassword123!"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "1|abc123def456...",
    "token_type": "Bearer",
    "expires_in": 86400,
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "vendor@example.com",
      "name": "ABC Manufacturing Co.",
      "account_type": "vendor"
    },
    "vendor": {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "company_name": "ABC Manufacturing Co.",
      "status": "active",
      "portal_access_enabled": true
    }
  },
  "message": "Login successful"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid credentials
- `403 Forbidden`: Account locked, portal access disabled, or onboarding not completed
- `422 Validation Error`: Missing or invalid fields
- `429 Too Many Requests`: Rate limit exceeded

#### 2. Logout
```http
POST /api/v1/vendor/auth/logout
Authorization: Bearer {token}
```

Revoke authentication token and end session.

**Query Parameters:**
- `all_devices` (boolean, optional): Logout from all devices (default: false)

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "tokens_revoked": 1
  },
  "message": "Logout successful"
}
```

#### 3. Request Password Reset
```http
POST /api/v1/vendor/auth/password/email
```

Request password reset email.

**Request Body:**
```json
{
  "email": "vendor@example.com"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset email sent successfully"
}
```

**Error Responses:**
- `404 Not Found`: Email not found or vendor account not found
- `422 Validation Error`: Invalid email format
- `429 Too Many Requests`: Rate limit exceeded (1 request per 60 seconds)

#### 4. Reset Password
```http
POST /api/v1/vendor/auth/password/reset
```

Reset password using token from email.

**Request Body:**
```json
{
  "token": "abc123def456...",
  "email": "vendor@example.com",
  "password": "NewSecurePassword123!",
  "password_confirmation": "NewSecurePassword123!"
}
```

**Password Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset successful. Please login with your new password."
}
```

**Error Responses:**
- `400 Bad Request`: Invalid or expired token
- `422 Validation Error`: Password doesn't meet requirements or confirmation doesn't match

---

### Quote Management

#### 5. Get Vendor Quotes
```http
GET /api/v1/vendor/quotes
Authorization: Bearer {token}
```

Retrieve paginated list of quotes assigned to vendor.

**Query Parameters:**
- `status` (string, optional): Filter by status (draft, sent, pending_response, accepted, rejected, countered, expired)
- `search` (string, optional): Search by quote number, order number, or customer name
- `page` (integer, optional): Page number (default: 1)
- `per_page` (integer, optional): Items per page (default: 20, max: 100)
- `sort_by` (string, optional): Sort field (created_at, sent_at, expires_at, quote_number)
- `sort_direction` (string, optional): Sort direction (asc, desc)

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "quotes": [
      {
        "id": "770e8400-e29b-41d4-a716-446655440002",
        "quote_number": "QT-2026-001",
        "order_number": "ORD-2026-123",
        "customer_name": "PT Example Company",
        "status": "sent",
        "vendor_price": 150000,
        "created_at": "2026-02-10T09:00:00Z",
        "sent_at": "2026-02-10T10:00:00Z",
        "expires_at": "2026-02-17T10:00:00Z",
        "is_expired": false,
        "unread_message_count": 2
      }
    ],
    "statistics": {
      "total_quotes": 45,
      "pending_quotes": 8,
      "accepted_quotes": 28,
      "rejected_quotes": 5,
      "acceptance_rate": 75.68,
      "average_response_time_hours": 18.5
    },
    "pagination": {
      "total": 45,
      "per_page": 20,
      "current_page": 1,
      "last_page": 3
    }
  }
}
```

#### 6. Get Quote Detail
```http
GET /api/v1/vendor/quotes/{quote_uuid}
Authorization: Bearer {token}
```

Retrieve complete details of a specific quote.

**Path Parameters:**
- `quote_uuid` (string, required): Quote UUID

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "quote_number": "QT-2026-001",
    "order_number": "ORD-2026-123",
    "status": "sent",
    "order": {
      "id": "880e8400-e29b-41d4-a716-446655440003",
      "order_number": "ORD-2026-123",
      "order_date": "2026-02-09T15:00:00Z",
      "items": [
        {
          "product_id": "990e8400-e29b-41d4-a716-446655440004",
          "product_name": "Custom Etching Plate",
          "quantity": 10,
          "specifications": {
            "material": "stainless_steel",
            "dimensions": "10x15cm"
          }
        }
      ]
    },
    "customer": {
      "id": "aa0e8400-e29b-41d4-a716-446655440005",
      "name": "PT Example Company",
      "email": "customer@example.com"
    },
    "quote_details": {
      "admin_notes": "Customer requires delivery by end of month"
    },
    "history": [
      {
        "status": "sent",
        "timestamp": "2026-02-10T10:00:00Z",
        "user": "Admin User",
        "notes": "Quote sent to vendor"
      }
    ]
  }
}
```

**Error Responses:**
- `403 Forbidden`: Quote does not belong to vendor
- `404 Not Found`: Quote not found

#### 7. Accept Quote
```http
POST /api/v1/vendor/quotes/{quote_uuid}/accept
Authorization: Bearer {token}
```

Accept a quote with estimated delivery days.

**Path Parameters:**
- `quote_uuid` (string, required): Quote UUID

**Request Body:**
```json
{
  "estimated_delivery_days": 14,
  "notes": "We can deliver within 2 weeks. Premium quality materials will be used."
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "status": "accepted",
    "responded_at": "2026-02-11T10:30:00Z",
    "quote_details": {
      "estimated_delivery_days": 14,
      "notes": "We can deliver within 2 weeks. Premium quality materials will be used."
    }
  },
  "message": "Quote accepted successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Quote expired, already responded, or invalid status
- `403 Forbidden`: Quote does not belong to vendor
- `404 Not Found`: Quote not found
- `422 Validation Error`: Invalid estimated_delivery_days (must be positive integer)

#### 8. Reject Quote
```http
POST /api/v1/vendor/quotes/{quote_uuid}/reject
Authorization: Bearer {token}
```

Reject a quote with rejection reason.

**Path Parameters:**
- `quote_uuid` (string, required): Quote UUID

**Request Body:**
```json
{
  "rejection_reason": "We cannot meet the required specifications with our current equipment"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "status": "rejected",
    "responded_at": "2026-02-11T10:30:00Z",
    "quote_details": {
      "rejection_reason": "We cannot meet the required specifications with our current equipment"
    }
  },
  "message": "Quote rejected successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Quote expired, already responded, or invalid status
- `403 Forbidden`: Quote does not belong to vendor
- `404 Not Found`: Quote not found
- `422 Validation Error`: Missing or invalid rejection_reason (required, max 500 chars)

#### 9. Submit Counter Offer
```http
POST /api/v1/vendor/quotes/{quote_uuid}/counter-offer
Authorization: Bearer {token}
```

Submit a counter offer with alternative pricing.

**Path Parameters:**
- `quote_uuid` (string, required): Quote UUID

**Request Body:**
```json
{
  "counter_offer_amount": 175000,
  "notes": "We can offer this price if we use alternative materials that meet the same quality standards"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "status": "countered",
    "counter_offer_amount": 175000,
    "responded_at": "2026-02-11T10:30:00Z",
    "quote_details": {
      "notes": "We can offer this price if we use alternative materials that meet the same quality standards"
    }
  },
  "message": "Counter offer submitted successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Quote expired, already responded, or invalid status
- `403 Forbidden`: Quote does not belong to vendor
- `404 Not Found`: Quote not found
- `422 Validation Error`: Invalid counter_offer_amount (must be positive number)

---

### Profile Management

#### 10. Get Vendor Profile
```http
GET /api/v1/vendor/profile
Authorization: Bearer {token}
```

Retrieve vendor profile information and performance metrics.

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "vendor": {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "company_name": "ABC Manufacturing Co.",
      "vendor_code": "VND-001",
      "email": "vendor@example.com",
      "phone": "+62 21 1234 5678",
      "contact_person": "John Doe",
      "address": "Jl. Sudirman No. 123, Jakarta",
      "status": "active",
      "specializations": ["metal_etching", "glass_etching"],
      "certifications": ["ISO 9001", "ISO 14001"]
    },
    "performance_metrics": {
      "total_quotes": 45,
      "accepted_quotes": 28,
      "rejected_quotes": 5,
      "pending_quotes": 8,
      "acceptance_rate": 75.68,
      "average_response_time_hours": 18.5,
      "overall_rating": 4.5,
      "quality_rating": 4.7,
      "timeliness_rating": 4.3,
      "communication_rating": 4.6
    }
  }
}
```

#### 11. Update Vendor Profile
```http
PUT /api/v1/vendor/profile
Authorization: Bearer {token}
```

Update vendor profile information.

**Request Body (all fields optional):**
```json
{
  "email": "newemail@example.com",
  "phone": "+62 21 9876 5432",
  "contact_person": "Jane Smith",
  "address": "Jl. Thamrin No. 456, Jakarta",
  "location": {
    "latitude": -6.2088,
    "longitude": 106.8456
  }
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "vendor": {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "email": "newemail@example.com",
      "phone": "+62 21 9876 5432",
      "contact_person": "Jane Smith",
      "address": "Jl. Thamrin No. 456, Jakarta"
    }
  },
  "message": "Profile updated successfully"
}
```

**Error Responses:**
- `422 Validation Error`: Email already taken or invalid data

**Note:** Company name and vendor code cannot be changed through this endpoint.

---

### Message Thread

#### 12. Get Quote Messages
```http
GET /api/v1/vendor/quotes/{quote_uuid}/messages
Authorization: Bearer {token}
```

Retrieve paginated list of messages for a specific quote.

**Path Parameters:**
- `quote_uuid` (string, required): Quote UUID

**Query Parameters:**
- `page` (integer, optional): Page number (default: 1)
- `per_page` (integer, optional): Items per page (default: 20, max: 50)

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "880e8400-e29b-41d4-a716-446655440003",
        "sender_type": "admin",
        "sender_name": "Admin User",
        "message": "Please confirm if you can meet the delivery deadline",
        "attachments": [],
        "is_read": true,
        "created_at": "2026-02-11T09:00:00Z"
      },
      {
        "id": "990e8400-e29b-41d4-a716-446655440004",
        "sender_type": "vendor",
        "sender_name": "ABC Manufacturing Co.",
        "message": "Yes, we can meet the deadline",
        "attachments": [],
        "is_read": false,
        "created_at": "2026-02-11T10:00:00Z"
      }
    ],
    "pagination": {
      "total": 15,
      "per_page": 20,
      "current_page": 1,
      "last_page": 1
    }
  }
}
```

**Error Responses:**
- `403 Forbidden`: Quote does not belong to vendor
- `404 Not Found`: Quote not found

#### 13. Send Quote Message
```http
POST /api/v1/vendor/quotes/{quote_uuid}/messages
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

Send a message to admin regarding a specific quote.

**Path Parameters:**
- `quote_uuid` (string, required): Quote UUID

**Request Body (multipart/form-data):**
- `message` (string, required): Message content (max 5000 chars)
- `attachments[]` (file, optional): File attachments (max 5 files, 10MB each)

**Allowed File Types:**
- Documents: pdf, doc, docx
- Images: jpg, jpeg, png
- Spreadsheets: xls, xlsx

**Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "aa0e8400-e29b-41d4-a716-446655440005",
    "sender_type": "vendor",
    "sender_name": "ABC Manufacturing Co.",
    "message": "I have a question about the specifications",
    "attachments": [
      {
        "filename": "specifications.pdf",
        "url": "https://storage.example.com/tenant_123/quotes/770e8400/messages/abc123_specifications.pdf",
        "size": 524288,
        "type": "application/pdf"
      }
    ],
    "created_at": "2026-02-11T14:30:00Z"
  },
  "message": "Message sent successfully"
}
```

**Error Responses:**
- `400 Bad Request`: File too large, invalid file type, or too many attachments
- `403 Forbidden`: Quote does not belong to vendor
- `404 Not Found`: Quote not found
- `422 Validation Error`: Missing message or invalid data

---

## Error Handling

All error responses follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field_name": ["Validation error message"]
    }
  }
}
```

### Common Error Codes

- `AUTHENTICATION_FAILED`: Invalid credentials
- `ACCOUNT_LOCKED`: Account temporarily locked due to failed login attempts
- `PORTAL_ACCESS_DISABLED`: Vendor portal access is disabled
- `ONBOARDING_NOT_COMPLETED`: Vendor onboarding not completed
- `VENDOR_INACTIVE`: Vendor status is not active
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `VALIDATION_ERROR`: Request validation failed
- `FORBIDDEN`: Access denied
- `NOT_FOUND`: Resource not found
- `QUOTE_EXPIRED`: Quote has expired
- `QUOTE_ALREADY_RESPONDED`: Quote has already been responded to
- `INVALID_STATUS`: Quote status doesn't allow this action
- `FILE_TOO_LARGE`: File size exceeds limit
- `INVALID_FILE_TYPE`: File type not allowed
- `TOO_MANY_ATTACHMENTS`: Too many file attachments

## Best Practices

### 1. Token Management
- Store tokens securely (never in localStorage for production)
- Implement token refresh logic before expiration
- Handle 401 responses by redirecting to login

### 2. Error Handling
- Always check the `success` field in responses
- Display user-friendly error messages from `error.message`
- Log detailed errors for debugging

### 3. Rate Limiting
- Implement exponential backoff for rate-limited requests
- Display countdown timer for locked accounts
- Cache frequently accessed data to reduce API calls

### 4. File Uploads
- Validate file size and type on client-side before upload
- Show upload progress for better UX
- Handle upload failures gracefully with retry logic

### 5. Real-time Updates
- Poll for new messages every 30 seconds
- Implement WebSocket connection for real-time notifications (if available)
- Show unread message counts prominently

## Support

For API support and questions:
- Email: dev@canvastack.com
- Documentation: https://docs.canvastack.com/vendor-portal
- Status Page: https://status.canvastack.com

## Changelog

### Version 1.0.0 (February 2026)
- Initial release of Vendor Portal API
- Authentication endpoints (login, logout, password reset)
- Quote management endpoints (list, detail, accept, reject, counter offer)
- Profile management endpoints (get, update)
- Message thread endpoints (list, send)
- Comprehensive error handling and validation
- Rate limiting and security features
